import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
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
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import * as VideoThumbnails from "expo-video-thumbnails";

/** Filmstrip height */
const FILMSTRIP_HEIGHT = 64;

/** Handle width (the thin white bars) */
const HANDLE_WIDTH = 14;

/** Seeker line thickness */
const SEEKER_WIDTH = 6;

/** If you want the seeker to extend above/below the filmstrip */
const SEEKER_OVERHANG = 6;

/** Hit slop for better touch targets */
const HIT_SLOP = { top: 24, bottom: 24, left: 24, right: 24 };

/** How many thumbnails to generate */
const THUMBNAIL_COUNT = 8; // Fixed number of thumbnails regardless of duration

/** Maximum selection, in seconds */
const DEFAULT_MAX_DURATION = 60;

/** Padding around the trimmer */
const PADDING = 16;

/** Utility to format time (M:SS) */
function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface VideoTrimmerProps {
  uri: string;
  duration: number;
  maxDuration?: number;
  onTrimsChange?: (start: number, end: number) => void;
  onSeek?: (timeSec: number) => void;
  currentTime?: number;
}

const VideoTrimmer = ({
  uri,
  duration,
  maxDuration = DEFAULT_MAX_DURATION,
  onTrimsChange,
  onSeek,
  currentTime = 0,
}: VideoTrimmerProps) => {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);

  const [localStart, setLocalStart] = useState(0);
  const [localEnd, setLocalEnd] = useState(Math.min(duration, maxDuration));

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width - PADDING * 2);
  }, []);

  /************************************************************
   * 1) Shared Values for the selection region [leftEdge..rightEdge]
   ************************************************************/
  const leftEdge = useSharedValue(0);
  const leftEdgeOnStart = useSharedValue(0);

  // Default rightEdge => up to maxDuration
  const rightEdge = useSharedValue(
    containerWidth
      ? (Math.min(duration, maxDuration) / duration) * containerWidth
      : 0,
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
    let isMounted = true;
    setLoading(true);

    const generateThumbnails = async () => {
      try {
        const times = Array.from({ length: THUMBNAIL_COUNT }, (_, i) => {
          const progress =
            i === THUMBNAIL_COUNT - 1 ? 0.95 : i / (THUMBNAIL_COUNT - 1);
          return Math.round(progress * duration * 1000);
        });

        const results = await Promise.all(
          times.map((timeMs) =>
            VideoThumbnails.getThumbnailAsync(uri, {
              time: timeMs,
              quality: 0.6,
            }),
          ),
        );

        if (isMounted) {
          setThumbnails(results.map((r) => r.uri));
        }
      } catch (err) {
        console.warn("Error in thumbnail generation:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    generateThumbnails();

    return () => {
      isMounted = false;
    };
  }, [uri, duration]);

  /************************************************************
   * Utility: convert px -> seconds
   ************************************************************/
  const pxToSec = useCallback(
    (px: number) => {
      "worklet";
      if (!containerWidth) return 0;
      return (px / containerWidth) * duration;
    },
    [duration, containerWidth],
  );

  // Update rightEdge when containerWidth changes
  useEffect(() => {
    if (containerWidth) {
      rightEdge.value =
        (Math.min(duration, maxDuration) / duration) * containerWidth;
    }
  }, [containerWidth, duration, maxDuration]);

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
    },
  );

  /************************************************************
   * 5) Updated Gestures: push/pull seeker when crossing edges
   ************************************************************/

  // LEFT HANDLE => physically at [leftEdge - HANDLE_WIDTH.. leftEdge].
  const leftHandlePan = Gesture.Pan()
    .hitSlop(HIT_SLOP)
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
      const maxRangePx = (maxDuration / duration) * containerWidth;
      if (regionWidth > maxRangePx) {
        newLeft = rightEdge.value - maxRangePx;
        if (newLeft < 0) newLeft = 0;
      }

      leftEdge.value = newLeft;

      // Only adjust seeker if it's outside the new trim region
      if (!isSeeking.value && seekerX.value < newLeft) {
        seekerX.value = newLeft;
        if (onSeek) {
          runOnJS(onSeek)(pxToSec(seekerX.value));
        }
      }
    })
    .onEnd(() => {
      leftEdge.value = withSpring(leftEdge.value);
      isTrimming.value = false;
    });

  // RIGHT HANDLE => physically at [rightEdge.. rightEdge + HANDLE_WIDTH].
  const rightHandlePan = Gesture.Pan()
    .hitSlop(HIT_SLOP)
    .onBegin(() => {
      rightEdgeOnStart.value = rightEdge.value;
      isTrimming.value = true;
    })
    .onUpdate((e) => {
      let newRight = rightEdgeOnStart.value + e.translationX;

      // clamp => [leftEdge.. CONTAINER_WIDTH]
      if (newRight < leftEdge.value) newRight = leftEdge.value;
      if (newRight > containerWidth) newRight = containerWidth;

      // enforce maxDuration => region width <= maxRangePx
      const regionWidth = newRight - leftEdge.value;
      const maxRangePx = (maxDuration / duration) * containerWidth;
      if (regionWidth > maxRangePx) {
        newRight = leftEdge.value + maxRangePx;
        if (newRight > containerWidth) newRight = containerWidth;
      }

      rightEdge.value = newRight;

      // Only adjust seeker if it's outside the new trim region
      if (!isSeeking.value && seekerX.value > newRight) {
        seekerX.value = newRight;
        if (onSeek) {
          runOnJS(onSeek)(pxToSec(seekerX.value));
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
      if (newRight > containerWidth) {
        newRight = containerWidth;
        newLeft = containerWidth - width;
      }

      leftEdge.value = newLeft;
      rightEdge.value = newRight;

      // Only move seeker if it's outside the new trim region
      if (!isSeeking.value) {
        if (seekerX.value < newLeft) {
          seekerX.value = newLeft;
          if (onSeek) {
            runOnJS(onSeek)(pxToSec(seekerX.value));
          }
        } else if (seekerX.value > newRight) {
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
    .hitSlop(HIT_SLOP)
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
      isSeeking.value = false;
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
    width: containerWidth - rightEdge.value,
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

  // Update seeker position based on currentTime
  useAnimatedReaction(
    () => {
      if (!isSeeking.value && !isTrimming.value && containerWidth) {
        return (currentTime / duration) * containerWidth;
      }
      return null;
    },
    (position) => {
      if (position !== null) {
        seekerX.value = withTiming(
          Math.max(leftEdge.value, Math.min(rightEdge.value, position)),
          {
            duration: 100, // 100ms animation
            easing: (x) => x, // linear easing for smooth movement
          },
        );
      }
    },
    [currentTime, duration, containerWidth],
  );

  /************************************************************
   * RENDER
   ************************************************************/
  return containerWidth ? (
    <View style={styles.root} onLayout={handleLayout}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Trim Video</Text>
        <Text style={styles.headerTime}>
          {Math.round(localEnd - localStart)}s / {maxDuration}s
        </Text>
      </View>

      {/* Filmstrip Container */}
      <View
        style={[
          styles.filmstripContainer,
          { width: containerWidth, overflow: "visible" },
        ]}
      >
        {/* Thumbnails row */}
        <View style={styles.thumbnailRow}>
          {loading && thumbnails.length === 0 && (
            <ActivityIndicator
              style={{ position: "absolute", zIndex: 99, alignSelf: "center" }}
            />
          )}
          {thumbnails.map((thumbUri, index) => (
            <Image
              key={`thumb-${index}`}
              source={{ uri: thumbUri }}
              style={[
                styles.thumbnail,
                { width: containerWidth / THUMBNAIL_COUNT },
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
          >
            <View style={[styles.handleLine, styles.leftHandleLine]} />
          </Animated.View>
        </GestureDetector>

        {/* Right handle => physically at [rightEdge.. rightEdge+HANDLE_WIDTH] */}
        <GestureDetector gesture={rightHandlePan}>
          <Animated.View
            style={[styles.handle, styles.rightHandle, rightHandleStyle]}
          >
            <View style={[styles.handleLine, styles.rightHandleLine]} />
          </Animated.View>
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
  ) : (
    <View style={styles.root} onLayout={handleLayout} />
  );
};

/************************************************************
 * STYLES
 ************************************************************/
const styles = StyleSheet.create({
  root: {
    width: "100%",
    padding: PADDING,
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
    width: "100%",
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
    justifyContent: "center",
    alignItems: "center",
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
    borderRadius: 4,
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
  handleLine: {
    width: 2,
    height: "50%",
    backgroundColor: "#000",
  },
  leftHandleLine: {
    marginLeft: 1,
  },
  rightHandleLine: {
    marginRight: 1,
  },
});

export default VideoTrimmer;
