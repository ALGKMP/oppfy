import React from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Check, ChevronRight, Download, X } from "@tamagui/lucide-icons";

import PlayPause, {
  usePlayPauseAnimations,
} from "~/components/Icons/PlayPause";
import {
  Button,
  ScreenView,
  Spinner,
  Text,
  View,
  XStack,
} from "~/components/ui";
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
  const { saveState, saveToCameraRoll } = useSaveMedia();

  const onContinue = async () => {
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
    <ScreenView justifyContent="center" alignItems="center">
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
          <PreviewVideo uri={uri} />
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
          disabled={saveState === "saving" || saveState === "saved"}
          onPress={() =>
            saveToCameraRoll({
              uri,
              isNetworkUrl: false,
              mediaType: type === "photo" ? "image" : "video",
            })
          }
        >
          {saveState === "saved" ? (
            <Check />
          ) : saveState === "saving" ? (
            <Spinner />
          ) : (
            <Download />
          )}
        </Button>

        <Button
          flex={5}
          variant="primary"
          iconAfter={ChevronRight}
          onPress={onContinue}
        >
          Continue
        </Button>
      </XStack>
    </ScreenView>
  );
};

const PreviewImage = ({ uri }: { uri: string }) => (
  <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
);

const PreviewVideo = ({ uri }: { uri: string }) => {
  const { playPauseIcons, addPlay, addPause } = usePlayPauseAnimations();

  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.play();
  });

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
    <Pressable style={{ flex: 1 }} onPress={togglePlayback}>
      <VideoView
        style={{ flex: 1 }}
        player={player}
        nativeControls={false}
        contentFit="cover"
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
