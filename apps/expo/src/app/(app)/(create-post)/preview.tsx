import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import type { AVPlaybackStatus } from "expo-av";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ArrowBigRight, Download } from "@tamagui/lucide-icons";
import { Button, View, XStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import {
  CONTENT_SPACING,
  CONTROL_BUTTON_SIZE,
  SAFE_AREA_PADDING,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "~/constants/camera";
import useSaveVideo from "~/hooks/useSaveMedia";

const ASPECT_RATIOS = {
  PORTRAIT: {
    WIDTH: 9,
    HEIGHT: 16,
  },
  LANDSCAPE: {
    WIDTH: 16,
    HEIGHT: 9,
  },
};

// Select the desired aspect ratio (can be easily changed)
const TARGET_RATIO = ASPECT_RATIOS.PORTRAIT;

// Calculate the target aspect ratio
const TARGET_ASPECT_RATIO = TARGET_RATIO.WIDTH / TARGET_RATIO.HEIGHT;

// Calculate the maximum content height based on screen width and target aspect ratio
const MAX_CONTENT_HEIGHT = SCREEN_WIDTH / TARGET_ASPECT_RATIO;

const PreviewScreen = () => {
  const { type, uri, height, width } = useLocalSearchParams<{
    uri: string;
    type: "photo" | "video";
    height: string;
    width: string;
  }>();

  const { saveState, saveToCameraRoll } = useSaveVideo();

  const router = useRouter();

  const onContinue = () => {
    router.navigate({
      pathname: "/post-to",
      params: {
        uri,
        type,
        width,
        height,
      },
    });
  };

  // Calculate the aspect ratio of the content
  const contentAspectRatio =
    parseFloat(width ?? "0") / parseFloat(height ?? "0");

  // Determine the actual content height, constrained by MAX_CONTENT_HEIGHT
  const contentHeight = Math.min(
    SCREEN_WIDTH / contentAspectRatio,
    MAX_CONTENT_HEIGHT,
  );

  // Check if the content is considered "tall" (more than 60% of screen height)
  const isContentTall = contentHeight > SCREEN_HEIGHT * 0.6;

  // Calculate the top position for the content
  const topPosition = isContentTall
    ? SAFE_AREA_PADDING.paddingTop // If tall, position at the top of the safe area
    : (SCREEN_HEIGHT - contentHeight) / 2; // If not tall, center vertically

  return (
    <BaseScreenView
      paddingTop={0}
      paddingHorizontal={0}
      safeAreaEdges={["bottom"]}
    >
      <View flex={1}>
        <View
          width={SCREEN_WIDTH}
          borderRadius={20}
          overflow="hidden"
          alignSelf="center"
          position="absolute"
          height={contentHeight}
          top={topPosition}
        >
          {type === "photo" ? (
            <PreviewImage uri={uri ?? ""} />
          ) : (
            <PreviewVideo uri={uri ?? ""} />
          )}
        </View>

        <View
          position="absolute"
          top={SAFE_AREA_PADDING.paddingTop + 12}
          left={SAFE_AREA_PADDING.paddingLeft + 12}
        >
          <TouchableOpacity
            style={{
              marginBottom: CONTENT_SPACING,
              width: CONTROL_BUTTON_SIZE,
              height: CONTROL_BUTTON_SIZE,
              borderRadius: CONTROL_BUTTON_SIZE / 2,
              backgroundColor: "rgba(140, 140, 140, 0.3)",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => router.back()}
          >
            <Ionicons name="close" color="white" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <XStack gap="$4" paddingHorizontal="$4">
        <Button
          flex={1}
          size="$5"
          borderRadius="$7"
          icon={saveState === "idle" ? Download : undefined}
          onPress={() =>
            saveToCameraRoll({
              uri: uri ?? "",
              isNetworkUrl: false,
              mediaType: type == "photo" ? "image" : "video",
            })
          }
          disabled={saveState === "saving" || saveState === "saved"}
          disabledStyle={{ opacity: 0.5 }}
        >
          {saveState === "saving" ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : saveState === "saved" ? (
            "Saved"
          ) : (
            "Save"
          )}
        </Button>

        <Button
          flex={3}
          size="$5"
          borderRadius="$7"
          iconAfter={ArrowBigRight}
          onPress={onContinue}
        >
          Continue
        </Button>
      </XStack>
    </BaseScreenView>
  );
};

interface PreviewProps {
  uri: string;
}

const PreviewImage = ({ uri }: PreviewProps) => (
  <Image source={{ uri }} style={StyleSheet.absoluteFill} />
);

const PreviewVideo = ({ uri }: PreviewProps) => {
  const videoRef = useRef<Video>(null);

  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [showControls, setShowControls] = useState(true);

  const controlFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showControls) {
      const timeout = setTimeout(() => {
        Animated.timing(controlFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [controlFadeAnim, showControls]);

  const togglePlayback = () => {
    if (!status?.isLoaded) return;

    status.isPlaying
      ? videoRef.current?.pauseAsync()
      : videoRef.current?.playAsync();

    setShowControls(true);
    controlFadeAnim.setValue(1);
  };

  const handleVideoPress = () => {
    setShowControls(true);
    controlFadeAnim.setValue(1);
    togglePlayback();
  };

  return (
    <Pressable style={{ flex: 1 }} onPress={handleVideoPress}>
      <Video
        ref={videoRef}
        source={{ uri }}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
        style={{ flex: 1 }}
        onPlaybackStatusUpdate={(status) => setStatus(status)}
      />
      {showControls && (
        <Animated.View
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: [{ translateX: -24 }, { translateY: -24 }],
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            borderRadius: 48,
            padding: 10,
            opacity: controlFadeAnim,
          }}
        >
          <Ionicons
            name={status?.isLoaded && status.isPlaying ? "pause" : "play"}
            size={48}
            color="white"
          />
        </Animated.View>
      )}
    </Pressable>
  );
};

export default PreviewScreen;
