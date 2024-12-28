import React, { useCallback, useEffect, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Check, ChevronLeft } from "@tamagui/lucide-icons";

import { ImageCropper } from "~/components/MediaEditor/ImageCropper";
import VideoTrimmer from "~/components/MediaEditor/VideoTrimmer";
import {
  Button,
  ScreenView,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import useMediaProcessing from "~/hooks/media/useMediaProcessing";

const SCREEN_WIDTH = Dimensions.get("window").width;
const ASPECT_RATIO = 16 / 9;
const PREVIEW_HEIGHT = SCREEN_WIDTH * ASPECT_RATIO * 0.6;

interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

const MediaEditor = () => {
  const router = useRouter();
  const { type, uri, width, height } = useLocalSearchParams<{
    uri: string;
    type: "photo" | "video";
    width: string;
    height: string;
  }>();

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
  const [videoDuration, setVideoDuration] = useState(0);

  const { processVideo, processPhoto } = useMediaProcessing();

  const [currentTime, setCurrentTime] = useState(0);

  const player = useVideoPlayer(uri, (player) => {
    if (type === "video") {
      player.loop = true;
      player.play();
    }
  });

  useEffect(() => {
    if (type === "video") {
      const subscription = player.addListener("statusChange", ({ status }) => {
        if (status === "readyToPlay" && videoDuration === 0) {
          const duration = player.duration;
          setVideoDuration(duration);
          setTrimEnd(Math.min(duration, 60));
        }
      });

      const timeSubscription = player.addListener(
        "timeUpdate",
        ({ currentTime }) => {
          setCurrentTime(currentTime);
          if (currentTime >= trimEnd) {
            player.currentTime = trimStart;
          }
        },
      );

      return () => {
        subscription.remove();
        timeSubscription.remove();
      };
    }
  }, [type, player, videoDuration, trimStart, trimEnd]);

  const handleTrimsChange = useCallback(
    (start: number, end: number) => {
      setTrimStart(start);
      setTrimEnd(end);

      if (currentTime < start || currentTime > end) {
        player.currentTime = start;
      }
    },
    [player, currentTime],
  );

  const handleSeek = useCallback(
    (time: number) => {
      player.currentTime = time;
    },
    [player],
  );

  const onSave = useCallback(async () => {
    try {
      setIsProcessing(true);

      let processedUri: string;
      if (type === "video") {
        processedUri = await processVideo({
          uri,
          startTime: trimStart,
          endTime: trimEnd,
          crop: cropRegion,
        });
      } else {
        processedUri = await processPhoto({
          uri,
          crop: cropRegion,
        });
      }

      router.push({
        pathname: "/preview",
        params: {
          uri: processedUri,
          type,
          width: cropRegion.width.toString(),
          height: cropRegion.height.toString(),
        },
      });
    } catch (error) {
      console.error("Error processing media:", error);
      // TODO: Show error toast
    } finally {
      setIsProcessing(false);
    }
  }, [
    router,
    uri,
    type,
    cropRegion,
    trimStart,
    trimEnd,
    processVideo,
    processPhoto,
  ]);

  return (
    <ScreenView padding={0} safeAreaEdges={["top"]}>
      <YStack flex={1}>
        {/* Header */}
        <XStack
        //   paddingHorizontal="$4"
          paddingVertical="$3"
          alignItems="center"
          justifyContent="space-between"
        >
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
            disabled={isProcessing}
          >
            <BlurView intensity={50} style={styles.blurView}>
              <ChevronLeft color="white" />
            </BlurView>
          </TouchableOpacity>
          <Text fontSize="$6" fontWeight="bold">
            Edit {type === "photo" ? "Photo" : "Video"}
          </Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onSave}
            disabled={isProcessing}
          >
            <BlurView intensity={50} style={styles.blurView}>
              {isProcessing ? (
                <Spinner color="white" />
              ) : (
                <Check color="white" />
              )}
            </BlurView>
          </TouchableOpacity>
        </XStack>

        {/* Media Preview */}
        <View
          width={SCREEN_WIDTH}
          height={PREVIEW_HEIGHT}
          backgroundColor="$gray1"
          overflow="hidden"
        >
          {type === "photo" ? (
            <ImageCropper
              uri={uri}
              aspectRatio={ASPECT_RATIO}
              onCropChange={setCropRegion}
            />
          ) : (
            <VideoView
              style={StyleSheet.absoluteFill}
              player={player}
              nativeControls={false}
              contentFit="cover"
            />
          )}
        </View>

        {/* Controls */}
        <YStack flex={1}  gap="$4">
          {type === "video" && videoDuration > 0 && (
            <VideoTrimmer
              uri={uri}
              duration={videoDuration}
              maxDuration={60}
              onTrimsChange={handleTrimsChange}
              onSeek={handleSeek}
              currentTime={currentTime}
            />
          )}
        </YStack>
      </YStack>
    </ScreenView>
  );
};

export default MediaEditor;

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
});
