import React, { useCallback, useEffect, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { useVideoPlayer } from "expo-video";
import { Crop, Scissors } from "@tamagui/lucide-icons";

import { Text, XStack, YStack } from "~/components/ui";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const ReanimatedView = Reanimated.createAnimatedComponent(View);

interface VideoTrimmerProps {
  uri: string;
  duration: number;
  maxDuration?: number;
  onTrimsChange?: (start: number, end: number) => void;
}

const TRIMMER_HEIGHT = 64;
const HANDLE_WIDTH = 12;
const HANDLE_BORDER_WIDTH = 3;
const MAX_DURATION = 60; // 60 seconds

export const VideoTrimmer = ({
  uri,
  duration,
  maxDuration = MAX_DURATION,
  onTrimsChange,
}: VideoTrimmerProps) => {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(Math.min(duration, maxDuration));

  // Animation values for handles
  const startX = useSharedValue(0);
  const endX = useSharedValue(0);
  const startOffsetX = useSharedValue(0);
  const endOffsetX = useSharedValue(0);

  useEffect(() => {
    // TODO: Generate video thumbnails
    // This would use something like react-native-video-thumbnails
    // For now we'll use a placeholder
    setThumbnails(Array(10).fill(uri));
  }, [uri]);

  const updateTrimValues = useCallback(
    (start: number, end: number) => {
      setTrimStart(start);
      setTrimEnd(end);
      onTrimsChange?.(start, end);
    },
    [onTrimsChange],
  );

  // Gesture handlers for trim handles
  const startHandleGesture = Gesture.Pan()
    .onStart(() => {
      startOffsetX.value = startX.value;
    })
    .onUpdate((e) => {
      const newX = Math.max(
        0,
        Math.min(
          endX.value - HANDLE_WIDTH,
          startOffsetX.value + e.translationX,
        ),
      );
      startX.value = newX;
      runOnJS(updateTrimValues)(
        (newX / (SCREEN_WIDTH - HANDLE_WIDTH * 2)) * duration,
        trimEnd,
      );
    });

  const endHandleGesture = Gesture.Pan()
    .onStart(() => {
      endOffsetX.value = endX.value;
    })
    .onUpdate((e) => {
      const newX = Math.max(
        startX.value + HANDLE_WIDTH,
        Math.min(
          SCREEN_WIDTH - HANDLE_WIDTH,
          endOffsetX.value + e.translationX,
        ),
      );
      endX.value = newX;
      runOnJS(updateTrimValues)(
        trimStart,
        (newX / (SCREEN_WIDTH - HANDLE_WIDTH * 2)) * duration,
      );
    });

  // Animated styles for handles
  const startHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: startX.value }],
  }));

  const endHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: endX.value }],
  }));

  const selectedStyle = useAnimatedStyle(() => ({
    left: startX.value + HANDLE_WIDTH,
    right: SCREEN_WIDTH - endX.value,
  }));

  return (
    <YStack gap="$2">
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$2">
          <Scissors size={16} />
          <Text fontWeight="500">Trim Video</Text>
        </XStack>
        <Text fontSize="$3" color="$gray11">
          {Math.round(trimEnd - trimStart)}s / {maxDuration}s
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

        {/* Selected region overlay */}
        <ReanimatedView style={[styles.selectedRegion, selectedStyle]} />

        {/* Trim handles */}
        <GestureDetector gesture={startHandleGesture}>
          <ReanimatedView
            style={[styles.handle, styles.startHandle, startHandleStyle]}
          >
            <View style={styles.handleBar} />
          </ReanimatedView>
        </GestureDetector>

        <GestureDetector gesture={endHandleGesture}>
          <ReanimatedView
            style={[styles.handle, styles.endHandle, endHandleStyle]}
          >
            <View style={styles.handleBar} />
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

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const styles = StyleSheet.create({
  container: {
    height: TRIMMER_HEIGHT,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  thumbnailsContainer: {
    flexDirection: "row",
    height: "100%",
  },
  thumbnail: {
    flex: 1,
    height: "100%",
  },
  selectedRegion: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "white",
  },
  handle: {
    position: "absolute",
    top: 0,
    width: HANDLE_WIDTH,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  startHandle: {
    left: 0,
  },
  endHandle: {
    right: 0,
  },
  handleBar: {
    width: HANDLE_BORDER_WIDTH,
    height: "50%",
    backgroundColor: "white",
    borderRadius: HANDLE_BORDER_WIDTH / 2,
  },
  timeIndicators: {
    position: "absolute",
    bottom: 4,
    left: HANDLE_WIDTH + 4,
    right: HANDLE_WIDTH + 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
});

export default VideoTrimmer;
