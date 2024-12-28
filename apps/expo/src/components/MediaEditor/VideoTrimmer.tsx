import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, View } from "react-native";
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
  /** Local or remote video URI */
  uri: string;
  /** Total video length in seconds */
  duration: number;
  /** Maximum allowable length. Defaults to 60s. */
  maxDuration?: number;
  /**
   * Called whenever trimStart/trimEnd change.
   * (We’ll send the times in seconds.)
   */
  onTrimsChange?: (startSec: number, endSec: number) => void;

  /**
   * Called whenever the user actively drags the seeker (scrubbing).
   * We'll pass the time in seconds.
   */
  onSeek?: (timeSec: number) => void;

  /**
   * If you want to show the seeker at a particular time (e.g. from a video player),
   * pass it here. If you're not actively dragging, the seeker will sync to this time.
   */
  currentTime?: number;
}

/**
 * A trimmer that:
 * - Has 2 “handles” (left & right).
 * - The right side of the left handle is the “start” of the clip => startPx = leftEdge + HANDLE_WIDTH.
 * - The left side of the right handle is the “end” => endPx = rightEdge.
 * - A seeker bar that can only move within [startPx..endPx].
 * - If the left handle passes the seeker (while we are not dragging the seeker),
 *   we clamp the seeker so it stays flush with the handle (no delay).
 */
const ThreePieceVideoTrimmerWithSeeker: React.FC<VideoTrimmerProps> = ({
  uri,
  duration,
  maxDuration = DEFAULT_MAX_DURATION,
  onTrimsChange,
  onSeek,
  currentTime = 0,
}) => {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1) Thumbnails + loading
  // ─────────────────────────────────────────────────────────────────────────────
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // For textual display
  const [localStart, setLocalStart] = useState(0);
  const [localEnd, setLocalEnd] = useState(Math.min(duration, maxDuration));

  // ─────────────────────────────────────────────────────────────────────────────
  // 2) Shared Values for the TRIM region: leftEdge / rightEdge
  // ─────────────────────────────────────────────────────────────────────────────
  const leftEdge = useSharedValue(0);
  const leftEdgeOnStart = useSharedValue(0);

  const rightEdge = useSharedValue(
    (Math.min(duration, maxDuration) / duration) * CONTAINER_WIDTH,
  );
  const rightEdgeOnStart = useSharedValue(0);

  const regionLeftOnStart = useSharedValue(0);
  const regionRightOnStart = useSharedValue(0);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3) Shared Values for the SEEKER
  // ─────────────────────────────────────────────────────────────────────────────
  const seekerX = useSharedValue(0); // in px
  const seekerXOnStart = useSharedValue(0);
  const isSeeking = useSharedValue(false); // track if user is dragging

  // Optionally, track a timer so we can clear it if unmounting
  const seekingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4) Generate thumbnails
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
      // Optionally clear any leftover seeking timeouts
      if (seekingTimeoutRef.current) {
        clearTimeout(seekingTimeoutRef.current);
      }
    };
  }, [uri, duration]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 5) Utility: px -> seconds
  // ─────────────────────────────────────────────────────────────────────────────
  const pxToSec = useCallback(
    (px: number) => {
      "worklet";
      return (px / CONTAINER_WIDTH) * duration;
    },
    [duration],
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 6) Reaction for TRIM edges => localStart/localEnd => onTrimsChange
  //    Now the start is (leftEdge + HANDLE_WIDTH), end is (rightEdge).
  // ─────────────────────────────────────────────────────────────────────────────
  useAnimatedReaction(
    () => {
      const startPx = leftEdge.value + HANDLE_WIDTH;
      const endPx = rightEdge.value;
      // clamp so we never invert if user tries to do something crazy
      const actualStartPx = Math.min(startPx, endPx - 1); // at least 1 px difference
      const actualEndPx = Math.max(endPx, startPx + 1);

      const startSec = pxToSec(actualStartPx);
      const endSec = pxToSec(actualEndPx);
      return { startSec, endSec };
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
  // 7) Reaction for auto-updating the seeker if NOT currently dragging
  //    We clamp the seeker to [startPx..endPx].
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSeeking.value) {
      // We have to figure out the “startPx” and “endPx” from the current edges.
      const startPx = leftEdge.value + HANDLE_WIDTH;
      const endPx = rightEdge.value;

      // Convert currentTime -> px
      const clampedTime = Math.max(0, Math.min(currentTime, duration));
      let newPx = (clampedTime / duration) * CONTAINER_WIDTH;

      // Now clamp it within [startPx..endPx]
      if (newPx < startPx) newPx = startPx;
      if (newPx > endPx) newPx = endPx;

      // Animate the seeker
      seekerX.value = withTiming(newPx, { duration: 150 });
    }
  }, [
    currentTime,
    duration,
    isSeeking,
    leftEdge.value,
    rightEdge.value,
    seekerX,
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 8) GESTURES: left/right handle, region drag, seeker drag
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * LEFT HANDLE
   * - After we clamp newLeft, if it surpasses the seeker (and we're not actively seeking),
   *   snap the seeker to newLeft+HANDLE_WIDTH so there's no delay behind the handle.
   */
  const leftHandlePan = Gesture.Pan()
    .hitSlop({ horizontal: HANDLE_TOUCH_SLOP })
    .onBegin(() => {
      leftEdgeOnStart.value = leftEdge.value;
    })
    .onUpdate((e) => {
      let newLeft = leftEdgeOnStart.value + e.translationX;
      // Bound [0..(rightEdge - HANDLE_WIDTH)]
      if (newLeft < 0) newLeft = 0;
      if (newLeft > rightEdge.value - HANDLE_WIDTH) {
        newLeft = rightEdge.value - HANDLE_WIDTH;
      }
      // Enforce maxDuration => (endPx - startPx) <= maxRangePx
      // (where endPx = rightEdge.value, startPx = newLeft+HANDLE_WIDTH)
      const totalRangePx = rightEdge.value - (newLeft + HANDLE_WIDTH);
      const maxRangePx = (maxDuration / duration) * CONTAINER_WIDTH;
      if (totalRangePx > maxRangePx) {
        newLeft = rightEdge.value - HANDLE_WIDTH - maxRangePx;
        if (newLeft < 0) newLeft = 0; // extra clamp
      }

      leftEdge.value = newLeft;

      // ---- NEW LOGIC ----
      // If we're NOT seeking, and newLeft surpasses the seeker, we snap the seeker.
      if (!isSeeking.value) {
        const handleStart = newLeft + HANDLE_WIDTH;
        if (seekerX.value < handleStart) {
          seekerX.value = handleStart;
        }
      }
    })
    .onEnd(() => {
      leftEdge.value = withSpring(leftEdge.value);
    });

  /** RIGHT HANDLE (unchanged) */
  const rightHandlePan = Gesture.Pan()
    .hitSlop({ horizontal: HANDLE_TOUCH_SLOP })
    .onBegin(() => {
      rightEdgeOnStart.value = rightEdge.value;
    })
    .onUpdate((e) => {
      let newRight = rightEdgeOnStart.value + e.translationX;
      // Bound [(leftEdge+HANDLE_WIDTH)..CONTAINER_WIDTH]
      if (newRight < leftEdge.value + HANDLE_WIDTH) {
        newRight = leftEdge.value + HANDLE_WIDTH;
      }
      if (newRight > CONTAINER_WIDTH) newRight = CONTAINER_WIDTH;

      // Enforce maxDuration => (endPx - startPx) <= maxRangePx
      // startPx = leftEdge.value + HANDLE_WIDTH
      // endPx = newRight
      const totalRangePx = newRight - (leftEdge.value + HANDLE_WIDTH);
      const maxRangePx = (maxDuration / duration) * CONTAINER_WIDTH;
      if (totalRangePx > maxRangePx) {
        newRight = leftEdge.value + HANDLE_WIDTH + maxRangePx;
        if (newRight > CONTAINER_WIDTH) newRight = CONTAINER_WIDTH;
      }
      rightEdge.value = newRight;
    })
    .onEnd(() => {
      rightEdge.value = withSpring(rightEdge.value);
    });

  /**
   * REGION DRAG
   * We might similarly clamp the seeker if the user moves the entire region
   * to the right beyond the seeker, but only if you want it always flush.
   * For now we’ll skip, but you can do a similar snippet as with the left handle.
   */
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

      // Bound [0..CONTAINER_WIDTH]
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

      // If you want the seeker flush when the region passes it,
      // do something similar:
      if (!isSeeking.value) {
        const handleStart = newLeft + HANDLE_WIDTH;
        if (seekerX.value < handleStart) {
          seekerX.value = handleStart;
        }
      }
    })
    .onEnd(() => {
      leftEdge.value = withSpring(leftEdge.value);
      rightEdge.value = withSpring(rightEdge.value);
    });

  /**
   * SEEKER DRAG (the playhead)
   * Must clamp within [startPx..endPx] = [leftEdge + HANDLE_WIDTH..rightEdge].
   */
  const seekerPan = Gesture.Pan()
    .onBegin(() => {
      isSeeking.value = true; // user is manually dragging
      seekerXOnStart.value = seekerX.value;
    })
    .onUpdate((e) => {
      // The user’s dragging delta
      let newPos = seekerXOnStart.value + e.translationX;

      const startPx = leftEdge.value + HANDLE_WIDTH;
      const endPx = rightEdge.value;

      // clamp within [startPx..endPx]
      if (newPos < startPx) newPos = startPx;
      if (newPos > endPx) newPos = endPx;

      seekerX.value = newPos;

      // Convert to seconds => call onSeek
      const timeSec = pxToSec(newPos);
      if (onSeek) {
        runOnJS(onSeek)(timeSec);
      }
    })
    .onEnd(() => {
      seekerX.value = withSpring(seekerX.value);
      // We want to restore auto-sync after a short delay
      runOnJS(() => {
        // If there's an existing timeout, clear it
        if (seekingTimeoutRef.current) {
          clearTimeout(seekingTimeoutRef.current);
        }
        seekingTimeoutRef.current = setTimeout(() => {
          isSeeking.value = false;
        }, 200);
      })();
    });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9) Animated Styles: Overlays + Selected Area + Seeker
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
  // 10) Render
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
          {/* Center area for region drag */}
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

        {/* Seeker (playhead), clamped to [startPx..endPx] */}
        <GestureDetector gesture={seekerPan}>
          <Animated.View style={[styles.seeker, seekerStyle]} />
        </GestureDetector>
      </View>

      {/* Footer row with times */}
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

  /** Selected area */
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
  leftHandle: {
    // pinned by transformX=leftEdge
  },
  rightHandle: {
    // pinned by transformX=rightEdge
  },

  /** Seeker (playhead) */
  seeker: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 3, // or 2, or something thin
    backgroundColor: "#ff0000", // bright color so it's visible
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
});

export default ThreePieceVideoTrimmerWithSeeker;
