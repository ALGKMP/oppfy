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
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ArrowBigRight, Download, X } from "@tamagui/lucide-icons";
import { Button, View, XStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import {
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

  const videoRef = useRef<Video>(null);

  const onContinue = async () => {
    if (type === "video" && videoRef.current) {
      await videoRef.current.pauseAsync();
    }
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
  const contentAspectRatio = parseInt(width) / parseInt(height);

  // Determine the actual content height, constrained by available space
  const availableHeight =
    SCREEN_HEIGHT -
    SAFE_AREA_PADDING.paddingTop -
    SAFE_AREA_PADDING.paddingBottom -
    70;
  const contentHeight = Math.min(
    SCREEN_WIDTH / contentAspectRatio,
    availableHeight,
    MAX_CONTENT_HEIGHT,
  );

  // Calculate the top position for the content
  const topPosition =
    (availableHeight - contentHeight) / 2 + SAFE_AREA_PADDING.paddingTop;

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
            <PreviewImage uri={uri} />
          ) : (
            <PreviewVideo uri={uri} videoRef={videoRef} />
          )}

          <View position="absolute" top={12} left={12}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.back()}
            >
              <BlurView intensity={50} style={styles.blurView}>
                <X />
              </BlurView>
            </TouchableOpacity>
          </View>
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
              uri,
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

interface PreviewVideoProps extends PreviewProps {
  videoRef: React.RefObject<Video>;
}

const PreviewImage = ({ uri }: PreviewProps) => (
  <Image source={{ uri }} style={StyleSheet.absoluteFill} />
);

const PreviewVideo = ({ uri, videoRef }: PreviewVideoProps) => {
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
        onError={(error) => {
          console.log(error);
        }}
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

export default PreviewScreen;
