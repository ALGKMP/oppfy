import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, View } from "react-native";
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

/** Example UI kit; replace with <Text> from RN if you prefer */
import { Text } from "~/components/ui";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTAINER_WIDTH = SCREEN_WIDTH - 32;
const FILMSTRIP_HEIGHT = 64;

const HANDLE_WIDTH = 12;
const HANDLE_TOUCH_SLOP = 20;

const FRAME_COUNT = 8;
const DEFAULT_MAX_DURATION = 60;

/** Format mm:ss */
function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface VideoTrimmerProps {
  uri: string; // Video URI
  duration: number; // Total length in seconds
  maxDuration?: number;
  onTrimsChange?: (start: number, end: number) => void;
  onSeek?: (timeSec: number) => void;
}

/**
 * - Selection is [leftEdge.. rightEdge].
 * - Left handle is physically at [leftEdge - HANDLE_WIDTH.. leftEdge].
 * - Right handle is at [rightEdge.. rightEdge + HANDLE_WIDTH].
 * - Seeker is clamped to [leftEdge.. rightEdge].
 * - Dragging the region also moves the seeker if it crosses over.
 */
const ThreePieceVideoTrimmerWithSeeker: React.FC<VideoTrimmerProps> = ({
  uri,
  duration,
  maxDuration = DEFAULT_MAX_DURATION,
  onTrimsChange,
  onSeek,
}) => {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1) State for Thumbnails
  // ─────────────────────────────────────────────────────────────────────────────
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // For UI display
  const [localStart, setLocalStart] = useState(0);
  const [localEnd, setLocalEnd] = useState(Math.min(duration, maxDuration));

  // ─────────────────────────────────────────────────────────────────────────────
  // 2) Shared Values: [leftEdge.. rightEdge]
  // ─────────────────────────────────────────────────────────────────────────────
  const leftEdge = useSharedValue(0);
  const leftEdgeOnStart = useSharedValue(0);

  const rightEdge = useSharedValue(
    (Math.min(duration, maxDuration) / duration) * CONTAINER_WIDTH,
  );
  const rightEdgeOnStart = useSharedValue(0);

  // For region drag
  const regionLeftOnStart = useSharedValue(0);
  const regionRightOnStart = useSharedValue(0);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3) SEEKER
  // ─────────────────────────────────────────────────────────────────────────────
  const seekerX = useSharedValue(0);
  const seekerXOnStart = useSharedValue(0);

  // Are we dragging the seeker?
  const isSeeking = useSharedValue(false);
  // Are we trimming (handles or region)?
  const isTrimming = useSharedValue(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4) Thumbnails
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const step = duration / Math.max(1, FRAME_COUNT - 1);
        const tasks: Promise<VideoThumbnails.VideoThumbnailsResult>[] = [];
        for (let i = 0; i < FRAME_COUNT; i++) {
          const ms = Math.round(step * i * 1000);
          tasks.push(VideoThumbnails.getThumbnailAsync(uri, { time: ms }));
        }
        const results = await Promise.all(tasks);
        if (!cancel) {
          setThumbnails(results.map((r) => r.uri));
        }
      } catch (err) {
        console.warn("Error generating thumbnails", err);
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

  // ─────────────────────────────────────────────────────────────────────────────
  // 5) px -> sec
  // ─────────────────────────────────────────────────────────────────────────────
  const pxToSec = useCallback(
    (px: number) => {
      "worklet";
      return (px / CONTAINER_WIDTH) * duration;
    },
    [duration],
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 6) Reaction: edges => localStart/localEnd => onTrimsChange
  // ─────────────────────────────────────────────────────────────────────────────
  useAnimatedReaction(
    () => {
      // region is [leftEdge.. rightEdge]
      const startPx = leftEdge.value;
      const endPx = rightEdge.value;

      const actualStartPx = Math.min(startPx, endPx - 1);
      const actualEndPx = Math.max(endPx, startPx + 1);

      return {
        startSec: pxToSec(actualStartPx),
        endSec: pxToSec(actualEndPx),
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

  // ─────────────────────────────────────────────────────────────────────────────
  // 7) GESTURES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * LEFT HANDLE => [leftEdge - HANDLE_WIDTH.. leftEdge]
   * Only pushes seeker if shrinking across it (dragging right).
   */
  const leftHandlePan = Gesture.Pan()
    .hitSlop({ horizontal: HANDLE_TOUCH_SLOP })
    .onBegin(() => {
      leftEdgeOnStart.value = leftEdge.value;
      isTrimming.value = true;
    })
    .onUpdate((e) => {
      const translation = e.translationX;
      let newLeft = leftEdgeOnStart.value + translation;

      // clamp => 0.. rightEdge
      if (newLeft < 0) newLeft = 0;
      if (newLeft > rightEdge.value) newLeft = rightEdge.value;

      // enforce maxDuration => region width <= maxRangePx
      const totalWidthPx = rightEdge.value - newLeft;
      const maxRangePx = (maxDuration / duration) * CONTAINER_WIDTH;
      if (totalWidthPx > maxRangePx) {
        newLeft = rightEdge.value - maxRangePx;
        if (newLeft < 0) newLeft = 0;
      }

      leftEdge.value = newLeft;

      // If dragging right => push seeker if crossing
      if (!isSeeking.value && translation > 0) {
        if (newLeft > seekerX.value) {
          seekerX.value = newLeft;
        }
      }
    })
    .onEnd(() => {
      leftEdge.value = withSpring(leftEdge.value);
      isTrimming.value = false;
    });

  /**
   * RIGHT HANDLE => [rightEdge.. rightEdge + HANDLE_WIDTH]
   * Only pushes seeker if shrinking across it (dragging left).
   */
  const rightHandlePan = Gesture.Pan()
    .hitSlop({ horizontal: HANDLE_TOUCH_SLOP })
    .onBegin(() => {
      rightEdgeOnStart.value = rightEdge.value;
      isTrimming.value = true;
    })
    .onUpdate((e) => {
      const translation = e.translationX;
      let newRight = rightEdgeOnStart.value + translation;

      // clamp => leftEdge.. CONTAINER_WIDTH
      if (newRight < leftEdge.value) newRight = leftEdge.value;
      if (newRight > CONTAINER_WIDTH) newRight = CONTAINER_WIDTH;

      // enforce maxDuration => region width <= maxRangePx
      const totalWidthPx = newRight - leftEdge.value;
      const maxRangePx = (maxDuration / duration) * CONTAINER_WIDTH;
      if (totalWidthPx > maxRangePx) {
        newRight = leftEdge.value + maxRangePx;
        if (newRight > CONTAINER_WIDTH) newRight = CONTAINER_WIDTH;
      }

      rightEdge.value = newRight;

      // If dragging left => push seeker if crossing
      if (!isSeeking.value && translation < 0) {
        if (newRight < seekerX.value) {
          seekerX.value = newRight;
        }
      }
    })
    .onEnd(() => {
      rightEdge.value = withSpring(rightEdge.value);
      isTrimming.value = false;
    });

  /**
   * REGION DRAG => shift [leftEdge.. rightEdge] in tandem.
   * We also push/pull the seeker if it crosses from either side:
   *  - If shifting right => check if newLeft > seeker => push it.
   *  - If shifting left => check if newRight < seeker => push it.
   */
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

      // ─────────────────────────────────────────────────────────────────────────
      // ADD: If user is not seeking the playhead, we can push the seeker if
      // the region crosses over it.
      // ─────────────────────────────────────────────────────────────────────────
      if (!isSeeking.value) {
        if (shift > 0) {
          // region is moving right
          if (newLeft > seekerX.value) {
            seekerX.value = newLeft;
          }
        } else if (shift < 0) {
          // region is moving left
          if (newRight < seekerX.value) {
            seekerX.value = newRight;
          }
        }
      }
    })
    .onEnd(() => {
      leftEdge.value = withSpring(leftEdge.value);
      rightEdge.value = withSpring(rightEdge.value);
      isTrimming.value = false;
    });

  /**
   * SEEKER DRAG => clamp to [leftEdge.. rightEdge]
   */
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
      }, 200);
    });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8) Animated Styles
  // ─────────────────────────────────────────────────────────────────────────────
  const leftOverlayStyle = useAnimatedStyle(() => ({
    // covers [0.. leftEdge]
    width: leftEdge.value,
  }));

  const rightOverlayStyle = useAnimatedStyle(() => ({
    // covers [rightEdge.. CONTAINER_WIDTH]
    left: rightEdge.value,
    width: CONTAINER_WIDTH - rightEdge.value,
  }));

  // selected area => [leftEdge.. rightEdge]
  const selectedAreaStyle = useAnimatedStyle(() => {
    const width = rightEdge.value - leftEdge.value;
    return {
      left: leftEdge.value,
      width: width < 0 ? 0 : width,
    };
  });

  // left handle => physically from [leftEdge - HANDLE_WIDTH.. leftEdge]
  const leftHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftEdge.value - HANDLE_WIDTH }],
  }));

  // right handle => physically from [rightEdge.. rightEdge + HANDLE_WIDTH]
  const rightHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightEdge.value }],
  }));

  // seeker => pinned at [seekerX]
  const seekerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: seekerX.value }],
  }));

  // ─────────────────────────────────────────────────────────────────────────────
  // 9) Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.rootContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Trim Video</Text>
        <Text style={styles.headerTime}>
          {Math.round(localEnd - localStart)}s / {maxDuration}s
        </Text>
      </View>

      {/* Filmstrip */}
      <View style={styles.filmstripContainer}>
        {/* Thumbnails row */}
        <View style={[styles.thumbnailRow, { width: CONTAINER_WIDTH }]}>
          {loading && (
            <ActivityIndicator
              style={{ position: "absolute", zIndex: 99, alignSelf: "center" }}
            />
          )}
          {!loading &&
            thumbnails.map((thumbUri, idx) => (
              <Image
                key={`thumb-${idx}`}
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
          {/* REGION DRAG => We also push/pull seeker if region crosses it. */}
          <GestureDetector gesture={regionPan}>
            <View style={styles.centerDragArea} />
          </GestureDetector>
        </Animated.View>

        {/* Left handle => [leftEdge - HANDLE_WIDTH.. leftEdge] */}
        <GestureDetector gesture={leftHandlePan}>
          <Animated.View
            style={[styles.handle, styles.leftHandle, leftHandleStyle]}
          />
        </GestureDetector>

        {/* Right handle => [rightEdge.. rightEdge + HANDLE_WIDTH] */}
        <GestureDetector gesture={rightHandlePan}>
          <Animated.View
            style={[styles.handle, styles.rightHandle, rightHandleStyle]}
          />
        </GestureDetector>

        {/* Seeker => pinned at seekerX */}
        <GestureDetector gesture={seekerPan}>
          <Animated.View style={[styles.seeker, seekerStyle]} />
        </GestureDetector>
      </View>

      {/* Footer */}
      <View style={styles.footerRow}>
        <Text>{formatTime(localStart)}</Text>
        <Text>{formatTime(localEnd)}</Text>
      </View>
    </View>
  );
};

/** Styles */
const styles = StyleSheet.create({
  rootContainer: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontWeight: "600",
    fontSize: 16,
  },
  headerTime: {
    fontSize: 14,
  },
  filmstripContainer: {
    width: "100%",
    height: FILMSTRIP_HEIGHT,
    marginTop: 8,
    position: "relative",
  },
  thumbnailRow: {
    height: "100%",
    flexDirection: "row",
  },
  thumbnail: {
    height: "100%",
  },

  /** Overlays */
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  leftOverlay: {
    left: 0,
  },
  rightOverlay: {
    right: 0,
  },

  /** Selected area => [leftEdge.. rightEdge] */
  selectedArea: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "#fff",
    borderWidth: 2,
  },
  centerDragArea: {
    flex: 1,
  },

  /** Handles */
  handle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: HANDLE_WIDTH,
    backgroundColor: "#fff",
  },
  leftHandle: {},
  rightHandle: {},

  /** Seeker (playhead) */
  seeker: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#ff0000",
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
});

export default ThreePieceVideoTrimmerWithSeeker;
