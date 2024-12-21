import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { ResizeMode, Video } from "expo-av";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Download, X } from "@tamagui/lucide-icons";
import { Button, View, XStack } from "tamagui";

import PlayPause, {
  usePlayPauseAnimations,
} from "~/components/Icons/PlayPause";
import { Text } from "~/components/ui";
import { BaseScreenView } from "~/components/Views";
import useSaveMedia from "~/hooks/useSaveMedia";

const SCREEN_WIDTH = Dimensions.get("window").width;
const ASPECT_RATIO = 16 / 9;
const PREVIEW_HEIGHT = SCREEN_WIDTH * ASPECT_RATIO; // 16:9

const PreviewScreen = () => {
  const { type, uri, width, height } = useLocalSearchParams<{
    uri: string;
    type: "photo" | "video";
    width: string;
    height: string;
  }>();

  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const { saveState, saveToCameraRoll } = useSaveMedia();

  const onContinue = async () => {
    if (type === "video" && videoRef.current) {
      await videoRef.current.pauseAsync();
    }
    router.push({
      pathname: "/post-to",
      params: {
        uri,
        type,
        width,
        height,
      },
    });
  };

  return (
    <BaseScreenView justifyContent="center" alignItems="center">
      <View
        width={SCREEN_WIDTH}
        height={PREVIEW_HEIGHT}
        borderRadius={20}
        overflow="hidden"
        position="relative"
      >
        {type === "photo" ? (
          <PreviewImage uri={uri} />
        ) : (
          <PreviewVideo uri={uri} videoRef={videoRef} />
        )}

        <TouchableOpacity
          style={[
            styles.iconButton,
            { position: "absolute", top: 12, left: 12 },
          ]}
          onPress={() => router.back()}
        >
          <BlurView intensity={50} style={styles.blurView}>
            <X />
          </BlurView>
        </TouchableOpacity>
      </View>

      <XStack
        gap="$4"
        paddingHorizontal="$4"
        marginTop="$4"
        width={SCREEN_WIDTH}
      >
        <Button
          flex={1}
          size="$5"
          borderWidth="$1"
          borderColor="white"
          backgroundColor="$gray1"
          borderRadius="$10"
          onPress={() =>
            saveToCameraRoll({
              uri,
              isNetworkUrl: false,
              mediaType: type === "photo" ? "image" : "video",
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
            <Download size="$2" />
          )}
        </Button>

        <Button
          flex={4}
          size="$5"
          borderRadius="$10"
          borderWidth="$1"
          borderColor="white"
          backgroundColor="$gray1"
          onPress={onContinue}
        >
          <Text fontSize="$9" fontWeight="bold">
            CONTINUE
          </Text>
        </Button>
      </XStack>
    </BaseScreenView>
  );
};

const PreviewImage = ({ uri }: { uri: string }) => (
  <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
);

const PreviewVideo = ({
  uri,
  videoRef,
}: {
  uri: string;
  videoRef: React.RefObject<Video>;
}) => {
  const [status, setStatus] = useState<any>(null);
  const { playPauseIcons, addPlayPause } = usePlayPauseAnimations();

  const togglePlayback = () => {
    if (status?.isLoaded) {
      if (status.isPlaying) {
        videoRef.current?.pauseAsync();
      } else {
        videoRef.current?.playAsync();
      }
      addPlayPause(!status.isPlaying);
    }
  };

  return (
    <Pressable style={{ flex: 1 }} onPress={togglePlayback}>
      <Video
        ref={videoRef}
        source={{ uri }}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
        style={{ flex: 1 }}
        onPlaybackStatusUpdate={(s) => setStatus(s)}
      />
      {playPauseIcons.map((icon) => (
        <PlayPause key={icon.id} isPlaying={icon.isPlaying} />
      ))}
    </Pressable>
  );
};

export default PreviewScreen;

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
