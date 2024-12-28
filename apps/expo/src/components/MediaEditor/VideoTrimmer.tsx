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

/** Layout constants */
const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTAINER_WIDTH = SCREEN_WIDTH - 32; // horizontal padding
const FILMSTRIP_HEIGHT = 64;

/** The width of each handle. “Right side” of left handle = leftEdge + HANDLE_WIDTH */
const HANDLE_WIDTH = 12;
const HANDLE_TOUCH_SLOP = 20;

const FRAME_COUNT = 8;
const DEFAULT_MAX_DURATION = 60;

/** Utility: format mm:ss */
function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface VideoTrimmerProps {
  uri: string; // Video URI
  duration: number; // Total length in seconds
  maxDuration?: number; // Maximum allowable selection
  onTrimsChange?: (start: number, end: number) => void;
  onSeek?: (timeSec: number) => void;
}

const ThreePieceVideoTrimmerWithSeeker: React.FC<VideoTrimmerProps> = ({
  uri,
  duration,
  maxDuration = DEFAULT_MAX_DURATION,
  onTrimsChange,
  onSeek,
}) => {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1) Thumbnails + Loading
  // ─────────────────────────────────────────────────────────────────────────────
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // For UI display
  const [localStart, setLocalStart] = useState(0);
  const [localEnd, setLocalEnd] = useState(Math.min(duration, maxDuration));

  // ─────────────────────────────────────────────────────────────────────────────
  // 2) Shared Values for the TRIM region: leftEdge, rightEdge
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
  // 3) SEEKER State
  // ─────────────────────────────────────────────────────────────────────────────
  const seekerX = useSharedValue(0);
  const seekerXOnStart = useSharedValue(0);

  // Are we dragging the seeker?
  const isSeeking = useSharedValue(false);

  // Are we dragging *any* handle or the region?
  const isTrimming = useSharedValue(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4) Generate Thumbnails
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
      const startPx = leftEdge.value + HANDLE_WIDTH;
      const endPx = rightEdge.value;
      // clamp so we never invert
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
   * LEFT HANDLE
   * - Only move seeker if we drag *to the right* (e.translationX > 0)
   *   and the bounding box crosses the seeker’s position.
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

      // clamp
      if (newLeft < 0) {
        newLeft = 0;
      }
      if (newLeft > rightEdge.value - HANDLE_WIDTH) {
        newLeft = rightEdge.value - HANDLE_WIDTH;
      }

      // enforce maxDuration
      const totalRangePx = rightEdge.value - (newLeft + HANDLE_WIDTH);
      const maxRangePx = (maxDuration / duration) * CONTAINER_WIDTH;
      if (totalRangePx > maxRangePx) {
        newLeft = rightEdge.value - HANDLE_WIDTH - maxRangePx;
        if (newLeft < 0) newLeft = 0;
      }

      leftEdge.value = newLeft;

      // Only "push" the seeker if user is dragging RIGHT (translation > 0),
      // we're not currently dragging the seeker, and the new bounding box
      // crosses the seeker.
      if (!isSeeking.value && translation > 0) {
        const newStartPx = newLeft + HANDLE_WIDTH;
        if (newStartPx > seekerX.value) {
          seekerX.value = newStartPx;
        }
      }
    })
    .onEnd(() => {
      leftEdge.value = withSpring(leftEdge.value);
      isTrimming.value = false;
    });

  /**
   * RIGHT HANDLE
   * - Only move seeker if we drag *to the left* (e.translationX < 0)
   *   and the bounding box crosses the seeker’s position.
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

      // clamp
      if (newRight < leftEdge.value + HANDLE_WIDTH) {
        newRight = leftEdge.value + HANDLE_WIDTH;
      }
      if (newRight > CONTAINER_WIDTH) {
        newRight = CONTAINER_WIDTH;
      }

      // enforce maxDuration
      const totalRangePx = newRight - (leftEdge.value + HANDLE_WIDTH);
      const maxRangePx = (maxDuration / duration) * CONTAINER_WIDTH;
      if (totalRangePx > maxRangePx) {
        newRight = leftEdge.value + HANDLE_WIDTH + maxRangePx;
        if (newRight > CONTAINER_WIDTH) newRight = CONTAINER_WIDTH;
      }

      rightEdge.value = newRight;

      // Only "push" the seeker if user is dragging LEFT (translation < 0),
      // we're not currently dragging the seeker, and the new bounding box
      // crosses the seeker.
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
   * REGION DRAG
   * - Move leftEdge/rightEdge in tandem, but do NOT move seeker.
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

      // clamp
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
    })
    .onEnd(() => {
      leftEdge.value = withSpring(leftEdge.value);
      rightEdge.value = withSpring(rightEdge.value);
      isTrimming.value = false;
    });

  /**
   * SEEKER DRAG
   * - Only clamps to [startPx..endPx].
   */
  const seekerPan = Gesture.Pan()
    .onBegin(() => {
      isSeeking.value = true;
      seekerXOnStart.value = seekerX.value;
    })
    .onUpdate((e) => {
      let newPos = seekerXOnStart.value + e.translationX;
      const startPx = leftEdge.value + HANDLE_WIDTH;
      const endPx = rightEdge.value;

      if (newPos < startPx) newPos = startPx;
      if (newPos > endPx) newPos = endPx;

      seekerX.value = newPos;

      // callback for live scrubbing
      if (onSeek) {
        const timeSec = pxToSec(newPos);
        runOnJS(onSeek)(timeSec);
      }
    })
    .onEnd(() => {
      seekerX.value = withSpring(seekerX.value);
      // small delay before we say "done seeking"
      setTimeout(() => {
        isSeeking.value = false;
      }, 200);
    });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8) Animated Styles
  // ─────────────────────────────────────────────────────────────────────────────
  const leftOverlayStyle = useAnimatedStyle(() => ({
    width: leftEdge.value + HANDLE_WIDTH,
  }));

  const rightOverlayStyle = useAnimatedStyle(() => ({
    left: rightEdge.value,
    width: CONTAINER_WIDTH - rightEdge.value,
  }));

  const selectedAreaStyle = useAnimatedStyle(() => {
    const left = leftEdge.value + HANDLE_WIDTH;
    const width = rightEdge.value - left;
    return {
      left,
      width: width < 0 ? 0 : width,
    };
  });

  const leftHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftEdge.value }],
  }));

  const rightHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightEdge.value }],
  }));

  const seekerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: seekerX.value }],
  }));

  // ─────────────────────────────────────────────────────────────────────────────
  // 9) Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.rootContainer}>
      {/* Header row */}
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

        {/* Left overlay => [0..(leftEdge+HANDLE_WIDTH)] */}
        <Animated.View
          style={[styles.overlay, styles.leftOverlay, leftOverlayStyle]}
        />

        {/* Right overlay => [rightEdge..CONTAINER_WIDTH] */}
        <Animated.View
          style={[styles.overlay, styles.rightOverlay, rightOverlayStyle]}
        />

        {/* Selected area => [leftEdge+HANDLE_WIDTH..rightEdge] */}
        <Animated.View style={[styles.selectedArea, selectedAreaStyle]}>
          {/* Region Drag */}
          <GestureDetector gesture={regionPan}>
            <View style={styles.centerDragArea} />
          </GestureDetector>
        </Animated.View>

        {/* Left handle => pinned at leftEdge */}
        <GestureDetector gesture={leftHandlePan}>
          <Animated.View
            style={[styles.handle, styles.leftHandle, leftHandleStyle]}
          />
        </GestureDetector>

        {/* Right handle => pinned at rightEdge */}
        <GestureDetector gesture={rightHandlePan}>
          <Animated.View
            style={[styles.handle, styles.rightHandle, rightHandleStyle]}
          />
        </GestureDetector>

        {/* Seeker (playhead) => [startPx..endPx] */}
        <GestureDetector gesture={seekerPan}>
          <Animated.View style={[styles.seeker, seekerStyle]} />
        </GestureDetector>
      </View>

      {/* Footer row */}
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

  // Overlays
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

  // Selected area
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

  // Handles
  handle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: HANDLE_WIDTH,
    backgroundColor: "#fff",
  },
  leftHandle: {},
  rightHandle: {},

  // Seeker (playhead)
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
