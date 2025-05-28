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
import { Button, ScreenView, Spinner, View, XStack } from "~/components/ui";
import { useContacts } from "~/hooks/contacts";
import useSaveMedia from "~/hooks/useSaveMedia";

const SCREEN_WIDTH = Dimensions.get("window").width;
const MAX_HEIGHT = Dimensions.get("window").height * 0.7; // Maximum 70% of screen height

const PreviewScreen = () => {
  const { type, uri, width, height } = useLocalSearchParams<{
    uri: string;
    type: "photo" | "video";
    width: string;
    height: string;
  }>();

  const router = useRouter();
  const { saveState, saveToCameraRoll } = useSaveMedia();
  const { contactsPaginatedQuery: _ } = useContacts();

  // Calculate the display dimensions based on the actual media aspect ratio
  const mediaWidth = parseInt(width, 10);
  const mediaHeight = parseInt(height, 10);
  const aspectRatio = mediaWidth / mediaHeight;

  // Calculate display height based on screen width and media aspect ratio
  let displayHeight = SCREEN_WIDTH / aspectRatio;

  // Cap the height to prevent extremely tall images from taking up too much space
  if (displayHeight > MAX_HEIGHT) {
    displayHeight = MAX_HEIGHT;
  }

  const onContinue = () => {
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
    <ScreenView padding={0} safeAreaEdges={["top", "bottom"]}>
      <View flex={1} justifyContent="center">
        <View
          width={SCREEN_WIDTH}
          height={displayHeight}
          borderRadius={20}
          overflow="hidden"
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
  <Image
    source={{ uri }}
    style={StyleSheet.absoluteFill}
    contentFit="contain"
  />
);

const PreviewVideo = ({ uri }: { uri: string }) => {
  const { playPauseIcons, addPlay, addPause } = usePlayPauseAnimations();

  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.play();
  });

  const togglePlayback = async () => {
    if (player.playing) {
      player.pause();
      addPause();
    } else {
      player.play();
      addPlay();
    }
  };

  return (
    <Pressable style={{ flex: 1 }} onPress={togglePlayback}>
      <VideoView
        style={{ flex: 1 }}
        player={player}
        nativeControls={false}
        contentFit="contain"
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
