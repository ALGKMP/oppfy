import React, { useCallback, useEffect, useState } from "react";
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

/** Swap for your own UI kit or just use <Text> from RN */
import { Text } from "~/components/ui";

/** Layout constants */
const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTAINER_WIDTH = SCREEN_WIDTH - 32; // space for horizontal padding
const FILMSTRIP_HEIGHT = 64;

const HANDLE_WIDTH = 12;
const HANDLE_TOUCH_SLOP = 20;

const FRAME_COUNT = 8;
const DEFAULT_MAX_DURATION = 60;

/** Utility to display time in mm:ss */
function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface VideoTrimmerProps {
  uri: string; // local or remote video URI
  duration: number; // total length in seconds
  maxDuration?: number; // maximum allowable selection
  onTrimsChange?: (start: number, end: number) => void;
}

/**
 * A video trimmer that splits the UI into three "pieces":
 * left overlay, selected area, right overlay.
 * The selected area has its own handle logic to reduce jitter.
 */
const ThreePieceVideoTrimmer: React.FC<VideoTrimmerProps> = ({
  uri,
  duration,
  maxDuration = DEFAULT_MAX_DURATION,
  onTrimsChange,
}) => {
  // ---------------------------------------------------------------------------
  // 1) Loading + Thumbnails
  // ---------------------------------------------------------------------------
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // For textual display
  const [localStart, setLocalStart] = useState(0);
  const [localEnd, setLocalEnd] = useState(Math.min(duration, maxDuration));

  // ---------------------------------------------------------------------------
  // 2) Shared Values: leftEdge / rightEdge in px
  // ---------------------------------------------------------------------------
  const leftEdge = useSharedValue(0);
  const leftEdgeOnStart = useSharedValue(0);

  const rightEdge = useSharedValue(
    (Math.min(duration, maxDuration) / duration) * CONTAINER_WIDTH,
  );
  const rightEdgeOnStart = useSharedValue(0);

  // For center-drag gesture:
  const regionLeftOnStart = useSharedValue(0);
  const regionRightOnStart = useSharedValue(0);

  // ---------------------------------------------------------------------------
  // 3) Generate Thumbnails
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const step = duration / (FRAME_COUNT - 1);
        const promises: Promise<VideoThumbnails.VideoThumbnailsResult>[] = [];
        for (let i = 0; i < FRAME_COUNT; i++) {
          const ms = Math.round(step * i * 1000);
          promises.push(VideoThumbnails.getThumbnailAsync(uri, { time: ms }));
        }
        const results = await Promise.all(promises);
        if (!cancel) {
          setThumbnails(results.map((r) => r.uri));
        }
      } catch (e) {
        console.warn("Error generating thumbnails", e);
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

  // ---------------------------------------------------------------------------
  // 4) Convert px => seconds
  // ---------------------------------------------------------------------------
  const pxToSec = useCallback(
    (px: number) => {
      "worklet";
      return (px / CONTAINER_WIDTH) * duration;
    },
    [duration],
  );

  // ---------------------------------------------------------------------------
  // 5) useAnimatedReaction => local states + external callback
  // ---------------------------------------------------------------------------
  useAnimatedReaction(
    () => {
      const start = pxToSec(leftEdge.value);
      const end = pxToSec(rightEdge.value);
      return { start, end };
    },
    ({ start, end }) => {
      runOnJS(setLocalStart)(start);
      runOnJS(setLocalEnd)(end);
      onTrimsChange && runOnJS(onTrimsChange)(start, end);
    },
  );

  // ---------------------------------------------------------------------------
  // 6) Gestures
  // ---------------------------------------------------------------------------

  /** Left handle */
  const leftHandlePan = Gesture.Pan()
    .hitSlop({ horizontal: HANDLE_TOUCH_SLOP })
    .onBegin(() => {
      leftEdgeOnStart.value = leftEdge.value;
    })
    .onUpdate((e) => {
      let newLeft = leftEdgeOnStart.value + e.translationX;

      // Bound [0..rightEdge]
      if (newLeft < 0) {
        newLeft = 0;
      }
      if (newLeft > rightEdge.value) {
        newLeft = rightEdge.value;
      }

      // Enforce maxDuration => (rightEdge - newLeft) <= maxRangePx
      const currentRange = rightEdge.value - newLeft;
      const maxRangePx = (maxDuration / duration) * CONTAINER_WIDTH;
      if (currentRange > maxRangePx) {
        newLeft = rightEdge.value - maxRangePx;
      }

      leftEdge.value = newLeft;
    })
    .onEnd(() => {
      leftEdge.value = withSpring(leftEdge.value);
    });

  /** Right handle */
  const rightHandlePan = Gesture.Pan()
    .hitSlop({ horizontal: HANDLE_TOUCH_SLOP })
    .onBegin(() => {
      rightEdgeOnStart.value = rightEdge.value;
    })
    .onUpdate((e) => {
      let newRight = rightEdgeOnStart.value + e.translationX;

      // Bound [leftEdge..CONTAINER_WIDTH]
      if (newRight < leftEdge.value) {
        newRight = leftEdge.value;
      }
      if (newRight > CONTAINER_WIDTH) {
        newRight = CONTAINER_WIDTH;
      }

      // Enforce maxDuration => (newRight - leftEdge) <= maxRangePx
      const currentRange = newRight - leftEdge.value;
      const maxRangePx = (maxDuration / duration) * CONTAINER_WIDTH;
      if (currentRange > maxRangePx) {
        newRight = leftEdge.value + maxRangePx;
      }

      rightEdge.value = newRight;
    })
    .onEnd(() => {
      rightEdge.value = withSpring(rightEdge.value);
    });

  /** Center area (drag entire selection) */
  const regionPan = Gesture.Pan()
    .onBegin(() => {
      regionLeftOnStart.value = leftEdge.value;
      regionRightOnStart.value = rightEdge.value;
    })
    .onUpdate((e) => {
      const shift = e.translationX;
      let newLeft = regionLeftOnStart.value + shift;
      let newRight = regionRightOnStart.value + shift;
      const width = regionRightOnStart.value - regionLeftOnStart.value;

      // Keep within [0..CONTAINER_WIDTH]
      if (newLeft < 0) {
        newLeft = 0;
        newRight = width; // so total length stays the same
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
    });

  // ---------------------------------------------------------------------------
  // 7) Animated Styles for Overlays + Selected Area
  // ---------------------------------------------------------------------------

  /**
   * Left Overlay covers from [0..leftEdge]
   */
  const leftOverlayStyle = useAnimatedStyle(() => {
    return {
      width: leftEdge.value,
    };
  });

  /**
   * Right Overlay covers from [rightEdge..CONTAINER_WIDTH]
   */
  const rightOverlayStyle = useAnimatedStyle(() => {
    return {
      left: rightEdge.value,
      width: CONTAINER_WIDTH - rightEdge.value,
    };
  });

  /**
   * Selected Area covers [leftEdge..rightEdge].
   * We place it absolutely with left: leftEdge, width: ...
   */
  const selectedAreaStyle = useAnimatedStyle(() => {
    const width = rightEdge.value - leftEdge.value;
    return {
      left: leftEdge.value,
      width,
    };
  });

  // ---------------------------------------------------------------------------
  // 8) Render
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.rootContainer}>
      {/* Title row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Trim Video</Text>
        <Text style={styles.headerTime}>
          {Math.round(localEnd - localStart)}s / {maxDuration}s
        </Text>
      </View>

      {/* Filmstrip */}
      <View style={styles.filmstripContainer}>
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

        {/* Left Overlay => covers [0..leftEdge] */}
        <Animated.View
          style={[styles.overlay, styles.leftOverlay, leftOverlayStyle]}
        />

        {/* Right Overlay => covers [rightEdge..CONTAINER_WIDTH] */}
        <Animated.View
          style={[styles.overlay, styles.rightOverlay, rightOverlayStyle]}
        />

        {/* Selected Area => covers [leftEdge..rightEdge] */}
        <Animated.View style={[styles.selectedArea, selectedAreaStyle]}>
          {/* Center area (for dragging the entire region) */}
          <GestureDetector gesture={regionPan}>
            <View style={styles.centerDragArea} />
          </GestureDetector>

          {/* Left handle */}
          <GestureDetector gesture={leftHandlePan}>
            <View style={[styles.handle, styles.leftHandle]} />
          </GestureDetector>

          {/* Right handle */}
          <GestureDetector gesture={rightHandlePan}>
            <View style={[styles.handle, styles.rightHandle]} />
          </GestureDetector>
        </Animated.View>
      </View>

      {/* Time labels */}
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

  /** Overlays: left & right greyed-out regions */
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

  /** Selected area in the middle, with handles on each side */
  selectedArea: {
    position: "absolute",
    top: 0,
    bottom: 0,
    // slightly tinted background
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "#fff",
    borderWidth: 2,
  },
  centerDragArea: {
    position: "absolute",
    left: HANDLE_WIDTH,
    right: HANDLE_WIDTH,
    top: 0,
    bottom: 0,
  },
  handle: {
    position: "absolute",
    width: HANDLE_WIDTH,
    top: 0,
    bottom: 0,
    backgroundColor: "#fff",
  },
  leftHandle: {
    left: 0,
  },
  rightHandle: {
    right: 0,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
});

export default ThreePieceVideoTrimmer;
