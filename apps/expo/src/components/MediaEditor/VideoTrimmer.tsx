import React, { useCallback, useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { Scissors } from "@tamagui/lucide-icons";

import { Text, XStack, YStack } from "~/components/ui";

const SCREEN_WIDTH = Dimensions.get("window").width;
const TRIMMER_HEIGHT = 64;
const HANDLE_WIDTH = 12;
const HANDLE_BORDER_WIDTH = 3;
const MAX_DURATION = 60; // 60 seconds
const SEEK_WIDTH = 3;

const ReanimatedView = Reanimated.createAnimatedComponent(View);

interface VideoTrimmerProps {
  uri: string;
  duration: number;
  maxDuration?: number;
  onTrimsChange?: (start: number, end: number) => void;
  onSeek?: (time: number) => void;
  currentTime?: number;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const VideoTrimmer = ({
  uri,
  duration,
  maxDuration = MAX_DURATION,
  onTrimsChange,
  onSeek,
  currentTime = 0,
}: VideoTrimmerProps) => {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(Math.min(duration, maxDuration));
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);

  // Animation values
  const startX = useSharedValue(0);
  const endX = useSharedValue(SCREEN_WIDTH - HANDLE_WIDTH);
  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);
  const seekX = useSharedValue(
    (currentTime / duration) * (SCREEN_WIDTH - HANDLE_WIDTH),
  );

  useEffect(() => {
    if (!isDraggingSeek) {
      seekX.value = withTiming(
        (currentTime / duration) * (SCREEN_WIDTH - HANDLE_WIDTH),
      );
    }
  }, [currentTime, duration, isDraggingSeek]);

  useEffect(() => {
    // TODO: Generate video thumbnails
    // This would use something like react-native-video-thumbnails
    // For now we'll use a placeholder
    setThumbnails(Array(10).fill(uri));
  }, [uri]);

  const updateTrimValues = useCallback(
    (start: number, end: number) => {
      const newStart = Math.max(0, Math.min(start, end - 1));
      const newEnd = Math.min(duration, Math.max(newStart + 1, end));

      setTrimStart(newStart);
      setTrimEnd(newEnd);
      onTrimsChange?.(newStart, newEnd);
    },
    [duration, onTrimsChange],
  );

  // Seek gesture
  const seekGesture = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => {
      setIsDraggingSeek(true);
    })
    .onUpdate((e) => {
      const progress = SCREEN_WIDTH - HANDLE_WIDTH;
      const newX = Math.max(0, Math.min(progress, e.absoluteX));
      seekX.value = newX;
      const time = (newX / progress) * duration;
      onSeek?.(time);
    })
    .onEnd(() => {
      setIsDraggingSeek(false);
    });

  // Pan gesture for the entire trimmer region
  const panGesture = Gesture.Pan()
    .onStart(() => {
      "worklet";
      contextX.value = translateX.value;
    })
    .onUpdate((e) => {
      "worklet";
      const maxTranslate =
        SCREEN_WIDTH - (endX.value - startX.value) - HANDLE_WIDTH;
      translateX.value = Math.max(
        -startX.value,
        Math.min(maxTranslate, contextX.value + e.translationX),
      );

      const progress = SCREEN_WIDTH - HANDLE_WIDTH * 2;
      const newStart =
        ((startX.value + translateX.value) / progress) * duration;
      const newEnd = ((endX.value + translateX.value) / progress) * duration;

      runOnJS(updateTrimValues)(newStart, newEnd);
    });

  // Left handle gesture
  const leftHandleGesture = Gesture.Pan()
    .onStart(() => {
      "worklet";
      contextX.value = startX.value;
    })
    .onUpdate((e) => {
      "worklet";
      const minX = 0;
      const maxX = endX.value - HANDLE_WIDTH;
      startX.value = Math.max(
        minX,
        Math.min(maxX, contextX.value + e.translationX),
      );

      const progress = SCREEN_WIDTH - HANDLE_WIDTH * 2;
      const newStart = (startX.value / progress) * duration;
      runOnJS(updateTrimValues)(newStart, trimEnd);
    });

  // Right handle gesture
  const rightHandleGesture = Gesture.Pan()
    .onStart(() => {
      "worklet";
      contextX.value = endX.value;
    })
    .onUpdate((e) => {
      "worklet";
      const minX = startX.value + HANDLE_WIDTH;
      const maxX = SCREEN_WIDTH - HANDLE_WIDTH;
      endX.value = Math.max(
        minX,
        Math.min(maxX, contextX.value + e.translationX),
      );

      const progress = SCREEN_WIDTH - HANDLE_WIDTH * 2;
      const newEnd = (endX.value / progress) * duration;
      runOnJS(updateTrimValues)(trimStart, newEnd);
    });

  // Animated styles
  const trimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: startX.value }],
  }));

  const rightHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: endX.value }],
  }));

  const selectedRegionStyle = useAnimatedStyle(() => ({
    left: startX.value + HANDLE_WIDTH,
    right: SCREEN_WIDTH - endX.value,
  }));

  const seekStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: seekX.value }],
  }));

  return (
    <YStack gap="$2">
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$2">
          <Scissors size={16} />
          <Text fontWeight="500">Trim Video</Text>
        </XStack>
        <Text fontSize="$3" color="$gray11">
          {formatTime(trimEnd - trimStart)} / {formatTime(maxDuration)}
        </Text>
      </XStack>

      <View style={styles.container}>
        {/* Thumbnails */}
        <View style={styles.thumbnailsContainer}>
          {thumbnails.map((thumbnail, index) => (
            <Image
              key={index}
              source={{ uri: thumbnail }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          ))}
        </View>

        {/* Seek line */}
        <GestureDetector gesture={seekGesture}>
          <View style={StyleSheet.absoluteFill}>
            <ReanimatedView style={[styles.seekLine, seekStyle]} />
          </View>
        </GestureDetector>

        {/* Trimmer overlay */}
        <GestureDetector gesture={panGesture}>
          <ReanimatedView style={[styles.trimmerOverlay, trimmerStyle]}>
            {/* Selected region */}
            <ReanimatedView
              style={[styles.selectedRegion, selectedRegionStyle]}
            />

            {/* Left handle */}
            <GestureDetector gesture={leftHandleGesture}>
              <ReanimatedView
                style={[styles.handle, styles.leftHandle, leftHandleStyle]}
              >
                <View style={styles.handleBar} />
              </ReanimatedView>
            </GestureDetector>

            {/* Right handle */}
            <GestureDetector gesture={rightHandleGesture}>
              <ReanimatedView
                style={[styles.handle, styles.rightHandle, rightHandleStyle]}
              >
                <View style={styles.handleBar} />
              </ReanimatedView>
            </GestureDetector>
          </ReanimatedView>
        </GestureDetector>

        {/* Time indicators */}
        <View style={styles.timeIndicators}>
          <Text style={styles.timeText}>{formatTime(trimStart)}</Text>
          <Text style={styles.timeText}>{formatTime(trimEnd)}</Text>
        </View>
      </View>
    </YStack>
  );
};

const styles = StyleSheet.create({
  container: {
    height: TRIMMER_HEIGHT,
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  thumbnailsContainer: {
    flexDirection: "row",
    height: "100%",
  },
  thumbnail: {
    flex: 1,
    height: "100%",
  },
  trimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  selectedRegion: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: "white",
  },
  handle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: HANDLE_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  leftHandle: {
    left: 0,
  },
  rightHandle: {
    right: 0,
  },
  handleBar: {
    width: HANDLE_WIDTH - HANDLE_BORDER_WIDTH * 2,
    height: "100%",
    backgroundColor: "white",
    borderRadius: 2,
  },
  timeIndicators: {
    position: "absolute",
    bottom: -24,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: HANDLE_WIDTH,
  },
  timeText: {
    color: "#666",
    fontSize: 12,
  },
  seekLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SEEK_WIDTH,
    backgroundColor: "#fff",
    borderRadius: SEEK_WIDTH / 2,
  },
});

export default VideoTrimmer;
