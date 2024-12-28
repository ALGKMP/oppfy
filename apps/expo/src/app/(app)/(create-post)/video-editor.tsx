import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Check, ChevronLeft } from "@tamagui/lucide-icons";

import PlayPause, {
  usePlayPauseAnimations,
} from "~/components/Icons/PlayPause";
import VideoTrimmer from "~/components/MediaEditor/VideoTrimmer";
import {
  ScreenView,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import useMediaProcessing from "~/hooks/media/useMediaProcessing";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PREVIEW_SCALE = 0.7; // 70% of screen width

interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

/**
 * Video Editor Component
 */
const VideoEditorContent = ({
  uri,
  aspectRatio,
  onCropChange,
  onTrimChange,
}: {
  uri: string;
  aspectRatio: number;
  onCropChange: (crop: CropRegion) => void;
  onTrimChange: (start: number, end: number) => void;
}) => {
  const { playPauseIcons, addPlay, addPause } = usePlayPauseAnimations();
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(60);
  const [trimmerWidth, setTrimmerWidth] = useState(0);

  const previewWidth = SCREEN_WIDTH * PREVIEW_SCALE;
  const previewHeight = previewWidth / aspectRatio;

  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.play();
    player.timeUpdateEventInterval = 0.05;
  });

  useEffect(() => {
    const subscription = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay" && videoDuration === 0) {
        const duration = player.duration;
        setVideoDuration(duration);
        setTrimEnd(Math.min(duration, 60));
      }
    });

    const timeSubscription = player.addListener(
      "timeUpdate",
      ({ currentTime: time }) => {
        setCurrentTime(time);
        if (time >= trimEnd) {
          player.currentTime = trimStart;
        }
      },
    );

    return () => {
      subscription.remove();
      timeSubscription.remove();
    };
  }, [player, videoDuration, trimStart, trimEnd]);

  const handleTrimsChange = useCallback(
    (start: number, end: number) => {
      setTrimStart(start);
      setTrimEnd(end);
      onTrimChange(start, end);

      if (currentTime < start || currentTime > end) {
        player.currentTime = start;
      }
    },
    [player, currentTime, onTrimChange],
  );

  const handleSeek = useCallback(
    (time: number) => {
      player.currentTime = time;
    },
    [player],
  );

  const handleTrimmerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setTrimmerWidth(width);
  }, []);

  const togglePlayback = async () => {
    if (player.playing) {
      await player.pause();
      addPause();
    } else {
      await player.play();
      addPlay();
    }
  };

  return (
    <YStack flex={1}>
      <View
        width={previewWidth}
        height={previewHeight}
        backgroundColor="$gray1"
        overflow="hidden"
        alignSelf="center"
        borderRadius="$4"
      >
        <Pressable style={styles.videoContainer} onPress={togglePlayback}>
          <VideoView
            style={StyleSheet.absoluteFill}
            player={player}
            nativeControls={false}
            contentFit="cover"
          />
          {playPauseIcons.map((icon) => (
            <PlayPause key={icon.id} isPlaying={icon.isPlaying} />
          ))}
        </Pressable>
      </View>

      {videoDuration > 0 && (
        <View
          paddingHorizontal="$4"
          paddingVertical="$4"
          onLayout={handleTrimmerLayout}
        >
          {trimmerWidth > 0 && (
            <VideoTrimmer
              uri={uri}
              duration={videoDuration}
              maxDuration={60}
              onTrimsChange={handleTrimsChange}
              onSeek={handleSeek}
              currentTime={player.currentTime}
            />
          )}
        </View>
      )}
    </YStack>
  );
};

/**
 * Main Editor Screen
 */
const VideoEditor = () => {
  const router = useRouter();
  const { uri, width, height } = useLocalSearchParams<{
    uri: string;
    width: string;
    height: string;
  }>();

  const aspectRatio = parseInt(width) / parseInt(height);
  const previewWidth = SCREEN_WIDTH * PREVIEW_SCALE;
  const previewHeight = previewWidth / aspectRatio;

  const [isProcessing, setIsProcessing] = useState(false);
  const [cropRegion, setCropRegion] = useState<CropRegion>({
    x: 0,
    y: 0,
    width: parseInt(width),
    height: parseInt(height),
    rotation: 0,
  });
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(60);

  const { processVideo } = useMediaProcessing();

  const handleTrimChange = useCallback((start: number, end: number) => {
    setTrimStart(start);
    setTrimEnd(end);
  }, []);

  const onSave = useCallback(async () => {
    try {
      setIsProcessing(true);
      const processedUri = await processVideo({
        uri,
        startTime: trimStart,
        endTime: trimEnd,
        crop: cropRegion,
      });

      router.push({
        pathname: "/preview",
        params: {
          uri: processedUri,
          type: "video",
          width: cropRegion.width.toString(),
          height: cropRegion.height.toString(),
        },
      });
    } catch (error) {
      console.error("Error processing video:", error);
      // TODO: Show error toast
    } finally {
      setIsProcessing(false);
    }
  }, [router, uri, cropRegion, trimStart, trimEnd, processVideo]);

  return (
    <ScreenView paddingTop={0} safeAreaEdges={["top"]}>
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
          disabled={isProcessing}
        >
          <BlurView intensity={50} style={styles.blurView}>
            <ChevronLeft color="white" />
          </BlurView>
        </TouchableOpacity>

        <Text fontSize="$6" fontWeight="bold" color="white">
          Edit Video
        </Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onSave}
          disabled={isProcessing}
        >
          <BlurView intensity={50} style={styles.blurView}>
            {isProcessing ? <Spinner color="white" /> : <Check color="white" />}
          </BlurView>
        </TouchableOpacity>
      </XStack>

      {/* Editor Content */}
      <YStack flex={1} paddingVertical="$8">
        <VideoEditorContent
          uri={uri}
          aspectRatio={aspectRatio}
          onCropChange={setCropRegion}
          onTrimChange={handleTrimChange}
        />
      </YStack>
    </ScreenView>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 25,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  blurView: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(64, 64, 64, 0.4)",
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default VideoEditor;
