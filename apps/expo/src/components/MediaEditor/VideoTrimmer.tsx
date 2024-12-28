import React, { useCallback, useEffect, useState } from "react";
/** If you're NOT using expo-image, import { Image } from "react-native" */
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Image } from "expo-image";
import * as VideoThumbnails from "expo-video-thumbnails";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PADDING = 16;
/** The width of our filmstrip */
const CONTAINER_WIDTH = SCREEN_WIDTH - PADDING * 2;

/** Filmstrip height */
const FILMSTRIP_HEIGHT = 64;

/** Handle width (the thin white bars) */
const HANDLE_WIDTH = 14;

/** Seeker line thickness */
const SEEKER_WIDTH = 6;

/** If you want the seeker to extend above/below the filmstrip */
const SEEKER_OVERHANG = 6;

/** How many thumbnails to generate */
const FRAME_COUNT = 8;

/** Maximum selection, in seconds */
const DEFAULT_MAX_DURATION = 60;

/** Utility to format time (M:SS) */
function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * A "FancyVideoTrimmer" that:
 * - Shows a row of thumbnails (filmstrip).
 * - Lets the user drag left/right handles that physically appear *outside* the filmstrip edges.
 * - Drags a seeker line within the selection, automatically pushing/pulling the seeker
 *   if the region crosses it.
 */
export default function VideoTrimmer({
  uri,
  duration,
  maxDuration = DEFAULT_MAX_DURATION,
  onTrimsChange,
  onSeek,
}: {
  uri: string;
  duration: number;
  maxDuration?: number;
  onTrimsChange?: (start: number, end: number) => void;
  onSeek?: (timeSec: number) => void;
}) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [localStart, setLocalStart] = useState(0);
  const [localEnd, setLocalEnd] = useState(Math.min(duration, maxDuration));

  /************************************************************
   * 1) Shared Values for the selection region [leftEdge..rightEdge]
   ************************************************************/
  const leftEdge = useSharedValue(0);
  const leftEdgeOnStart = useSharedValue(0);

  // Default rightEdge => up to maxDuration
  const rightEdge = useSharedValue(
    (Math.min(duration, maxDuration) / duration) * CONTAINER_WIDTH
  );
  const rightEdgeOnStart = useSharedValue(0);

  // For dragging the entire region as a block
  const regionLeftOnStart = useSharedValue(0);
  const regionRightOnStart = useSharedValue(0);

  /************************************************************
   * 2) SEEKER
   ************************************************************/
  const seekerX = useSharedValue(0);
  const seekerXOnStart = useSharedValue(0);
  const isSeeking = useSharedValue(false);
  const isTrimming = useSharedValue(false);

  /************************************************************
   * 3) Generate Thumbnails
   ************************************************************/
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const step = duration / Math.max(1, FRAME_COUNT - 1);
        const tasks: Promise<VideoThumbnails.VideoThumbnailsResult>[] = [];
        for (let i = 0; i < FRAME_COUNT; i++) {
          const timeMs = Math.round(step * i * 1000);
          tasks.push(VideoThumbnails.getThumbnailAsync(uri, { time: timeMs }));
        }
        const results = await Promise.all(tasks);
        if (!cancel) {
          setThumbnails(results.map((r) => r.uri));
        }
      } catch (err) {
        console.warn("Error generating thumbnails:", err);
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancel = true;
    };
  }, [uri, duration]);

  /************************************************************
   * Utility: convert px -> seconds
   ************************************************************/
  const pxToSec = useCallback(
    (px: number) => {
      "worklet";
      return (px / CONTAINER_WIDTH) * duration;
    },
    [duration]
  );

  /************************************************************
   * 4) Reaction: edges => localStart/localEnd => onTrimsChange
   ************************************************************/
  useAnimatedReaction(
    () => {
      const startPx = Math.min(leftEdge.value, rightEdge.value);
      const endPx = Math.max(leftEdge.value, rightEdge.value);
      return {
        startSec: pxToSec(startPx),
        endSec: pxToSec(endPx),
      };
    },
    ({ startSec, endSec }) => {
      runOnJS(setLocalStart)(startSec);
      runOnJS(setLocalEnd)(endSec);
      if (onTrimsChange) {
        runOnJS(onTrimsChange)(startSec, endSec);
      }
    }
  );

  /************************************************************
   * 5) Updated Gestures: push/pull seeker when crossing edges
   ************************************************************/

  // LEFT HANDLE => physically at [leftEdge - HANDLE_WIDTH.. leftEdge].
  const leftHandlePan = Gesture.Pan()
    .onBegin(() => {
      leftEdgeOnStart.value = leftEdge.value;
      isTrimming.value = true;
    })
    .onUpdate((e) => {
      let newLeft = leftEdgeOnStart.value + e.translationX;

      // clamp => [0.. rightEdge]
      if (newLeft < 0) newLeft = 0;
      if (newLeft > rightEdge.value) newLeft = rightEdge.value;

      // enforce maxDuration => region width <= maxRangePx
      const regionWidth = rightEdge.value - newLeft;
      const maxRangePx = (maxDuration / duration) * CONTAINER_WIDTH;
      if (regionWidth > maxRangePx) {
        newLeft = rightEdge.value - maxRangePx;
        if (newLeft < 0) newLeft = 0;
      }

      leftEdge.value = newLeft;

      // Push or pull the seeker if crossing from left to right or right to left
      if (!isSeeking.value) {
        // Dragging right and crossing the seeker
        if (e.translationX > 0 && newLeft > seekerX.value) {
          seekerX.value = newLeft;
          if (onSeek) {
            runOnJS(onSeek)(pxToSec(seekerX.value));
          }
        }
        // Dragging left and crossing the seeker
        else if (e.translationX < 0 && newLeft < seekerX.value) {
          seekerX.value = newLeft;
          if (onSeek) {
            runOnJS(onSeek)(pxToSec(seekerX.value));
          }
        }
      }
    })
    .onEnd(() => {
      leftEdge.value = withSpring(leftEdge.value);
      isTrimming.value = false;
    });

  // RIGHT HANDLE => physically at [rightEdge.. rightEdge + HANDLE_WIDTH].
  const rightHandlePan = Gesture.Pan()
    .onBegin(() => {
      rightEdgeOnStart.value = rightEdge.value;
      isTrimming.value = true;
    })
    .onUpdate((e) => {
      let newRight = rightEdgeOnStart.value + e.translationX;

      // clamp => [leftEdge.. CONTAINER_WIDTH]
      if (newRight < leftEdge.value) newRight = leftEdge.value;
      if (newRight > CONTAINER_WIDTH) newRight = CONTAINER_WIDTH;

      // enforce maxDuration => region width <= maxRangePx
      const regionWidth = newRight - leftEdge.value;
      const maxRangePx = (maxDuration / duration) * CONTAINER_WIDTH;
      if (regionWidth > maxRangePx) {
        newRight = leftEdge.value + maxRangePx;
        if (newRight > CONTAINER_WIDTH) newRight = CONTAINER_WIDTH;
      }

      rightEdge.value = newRight;

      // Pull or push the seeker if crossing from right to left or left to right
      if (!isSeeking.value) {
        // Dragging left and crossing the seeker
        if (e.translationX < 0 && newRight < seekerX.value) {
          seekerX.value = newRight;
          if (onSeek) {
            runOnJS(onSeek)(pxToSec(seekerX.value));
          }
        }
        // Dragging right and crossing the seeker
        else if (e.translationX > 0 && newRight > seekerX.value) {
          seekerX.value = newRight;
          if (onSeek) {
            runOnJS(onSeek)(pxToSec(seekerX.value));
          }
        }
      }
    })
    .onEnd(() => {
      rightEdge.value = withSpring(rightEdge.value);
      isTrimming.value = false;
    });

  // REGION DRAG => shift [leftEdge.. rightEdge] as a block
  const regionPan = Gesture.Pan()
    .onBegin(() => {
      regionLeftOnStart.value = leftEdge.value;
      regionRightOnStart.value = rightEdge.value;
      isTrimming.value = true;
    })
    .onUpdate((e) => {
      const shift = e.translationX;
      let newLeft = regionLeftOnStart.value + shift;
      let newRight = regionRightOnStart.value + shift;
      const width = regionRightOnStart.value - regionLeftOnStart.value;

      // clamp => [0.. CONTAINER_WIDTH]
      if (newLeft < 0) {
        newLeft = 0;
        newRight = width;
      }
      if (newRight > CONTAINER_WIDTH) {
        newRight = CONTAINER_WIDTH;
        newLeft = CONTAINER_WIDTH - width;
      }

      leftEdge.value = newLeft;
      rightEdge.value = newRight;

      // Push/pull the seeker if the region crosses it
      if (!isSeeking.value) {
        // Moving the trimmer box to the right
        if (shift > 0 && newLeft > seekerX.value) {
          seekerX.value = newLeft;
          if (onSeek) {
            runOnJS(onSeek)(pxToSec(seekerX.value));
          }
        }
        // Moving the trimmer box to the left
        else if (shift < 0 && newRight < seekerX.value) {
          seekerX.value = newRight;
          if (onSeek) {
            runOnJS(onSeek)(pxToSec(seekerX.value));
          }
        }
      }
    })
    .onEnd(() => {
      leftEdge.value = withSpring(leftEdge.value);
      rightEdge.value = withSpring(rightEdge.value);
      isTrimming.value = false;
    });

  // SEEKER DRAG => move between [leftEdge..rightEdge]
  const seekerPan = Gesture.Pan()
    .onBegin(() => {
      isSeeking.value = true;
      seekerXOnStart.value = seekerX.value;
    })
    .onUpdate((e) => {
      let newPos = seekerXOnStart.value + e.translationX;
      if (newPos < leftEdge.value) newPos = leftEdge.value;
      if (newPos > rightEdge.value) newPos = rightEdge.value;

      seekerX.value = newPos;
      if (onSeek) {
        runOnJS(onSeek)(pxToSec(newPos));
      }
    })
    .onEnd(() => {
      seekerX.value = withSpring(seekerX.value);
      setTimeout(() => {
        isSeeking.value = false;
      }, 100);
    });

  /************************************************************
   * 6) Animated Styles
   ************************************************************/
  // The left overlay covers [0.. leftEdge]
  const leftOverlayStyle = useAnimatedStyle(() => ({
    width: leftEdge.value,
  }));

  // The right overlay covers [rightEdge.. CONTAINER_WIDTH]
  const rightOverlayStyle = useAnimatedStyle(() => ({
    left: rightEdge.value,
    width: CONTAINER_WIDTH - rightEdge.value,
  }));

  // The selected area => white border => [leftEdge.. rightEdge]
  const selectedAreaStyle = useAnimatedStyle(() => {
    const width = rightEdge.value - leftEdge.value;
    return {
      left: leftEdge.value,
      width: width < 0 ? 0 : width,
    };
  });

  // LEFT handle => physically at [leftEdge - HANDLE_WIDTH.. leftEdge]
  const leftHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftEdge.value - HANDLE_WIDTH }],
  }));

  // RIGHT handle => physically at [rightEdge.. rightEdge + HANDLE_WIDTH]
  const rightHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightEdge.value }],
  }));

  // SEEKER => extends above/below the filmstrip
  const seekerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: seekerX.value }],
  }));

  /************************************************************
   * RENDER
   ************************************************************/
  return (
    <View style={styles.root}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Trim Video</Text>
        <Text style={styles.headerTime}>
          {Math.round(localEnd - localStart)}s / {maxDuration}s
        </Text>
      </View>

      {/* Filmstrip Container */}
      {/* IMPORTANT: Remove or override "overflow: hidden" so the handles show outside. */}
      <View style={[styles.filmstripContainer, { overflow: "visible" }]}>
        {/* Thumbnails row */}
        <View style={styles.thumbnailRow}>
          {loading && (
            <ActivityIndicator
              style={{ position: "absolute", zIndex: 99, alignSelf: "center" }}
            />
          )}
          {!loading &&
            thumbnails.map((thumbUri, index) => (
              <Image
                key={`thumb-${index}`}
                source={{ uri: thumbUri }}
                style={[
                  styles.thumbnail,
                  { width: CONTAINER_WIDTH / FRAME_COUNT },
                ]}
                contentFit="cover"
              />
            ))}
        </View>

        {/* Left overlay => [0.. leftEdge] */}
        <Animated.View
          style={[styles.overlay, styles.leftOverlay, leftOverlayStyle]}
        />

        {/* Right overlay => [rightEdge.. CONTAINER_WIDTH] */}
        <Animated.View
          style={[styles.overlay, styles.rightOverlay, rightOverlayStyle]}
        />

        {/* Selected area => [leftEdge.. rightEdge] */}
        <Animated.View style={[styles.selectedArea, selectedAreaStyle]}>
          <GestureDetector gesture={regionPan}>
            <View style={styles.centerDragArea} />
          </GestureDetector>
        </Animated.View>

        {/* Left handle => physically at [leftEdge - HANDLE_WIDTH.. leftEdge] */}
        <GestureDetector gesture={leftHandlePan}>
          <Animated.View
            style={[styles.handle, styles.leftHandle, leftHandleStyle]}
          />
        </GestureDetector>

        {/* Right handle => physically at [rightEdge.. rightEdge+HANDLE_WIDTH] */}
        <GestureDetector gesture={rightHandlePan}>
          <Animated.View
            style={[styles.handle, styles.rightHandle, rightHandleStyle]}
          />
        </GestureDetector>

        {/* Seeker => extends above & below the filmstrip */}
        <GestureDetector gesture={seekerPan}>
          <Animated.View style={[styles.seeker, seekerStyle]} />
        </GestureDetector>
      </View>

      {/* Footer row => times */}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>{formatTime(localStart)}</Text>
        <Text style={styles.footerText}>{formatTime(localEnd)}</Text>
      </View>
    </View>
  );
}

/************************************************************
 * STYLES
 ************************************************************/
const styles = StyleSheet.create({
  root: {
    width: "100%",
    padding: PADDING,
    backgroundColor: "#000",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  headerTime: {
    fontSize: 14,
    color: "#fff",
  },
  filmstripContainer: {
    width: CONTAINER_WIDTH,
    height: FILMSTRIP_HEIGHT,
    marginTop: 12,
    position: "relative",
    backgroundColor: "#333",
    borderRadius: 6,
    // Originally was overflow: "hidden"
    // If we keep overflow: "hidden", the handles outside get clipped.
    // We'll remove it or set overflow: "visible" so the handles show up outside.
  },
  thumbnailRow: {
    flexDirection: "row",
    height: "100%",
  },
  thumbnail: {
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)", // dark overlay
  },
  leftOverlay: {
    left: 0,
  },
  rightOverlay: {
    right: 0,
  },
  selectedArea: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderColor: "#fff",
    borderWidth: 1,
  },
  centerDragArea: {
    flex: 1,
  },
  handle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: HANDLE_WIDTH,
    backgroundColor: "#fff",
  },
  leftHandle: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  rightHandle: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  seeker: {
    position: "absolute",
    width: SEEKER_WIDTH,
    backgroundColor: "#fff",
    top: -SEEKER_OVERHANG,
    bottom: -SEEKER_OVERHANG,
    borderRadius: 2,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  footerText: {
    color: "#fff",
    fontSize: 14,
  },
});
