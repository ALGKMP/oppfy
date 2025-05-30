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
import { Stack, Text, YStack } from "tamagui";

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
      <YStack flex={1} justifyContent="space-between" padding="$4">
        {/* Header Section */}
        <YStack alignItems="center" paddingTop="$2" gap="$2">
          <Text
            fontSize={28}
            fontWeight="900"
            color="$color"
            textAlign="center"
            letterSpacing={-0.5}
          >
            Preview
          </Text>
          <Text
            fontSize={15}
            color="$color"
            opacity={0.7}
            textAlign="center"
            fontWeight="500"
          >
            Looking good? Let's share it with the world
          </Text>
        </YStack>

        {/* Media Section */}
        <View flex={1} justifyContent="center">
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                overflow: "hidden",
                padding: 4,
                shadowColor: "rgba(0,0,0,0.8)",
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.5,
                shadowRadius: 40,
                elevation: 20,
              }}
            >
              <View
                width={SCREEN_WIDTH - 60}
                height={displayHeight - 40}
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

                {/* Media type badge */}
                <Stack
                  position="absolute"
                  top={12}
                  right={12}
                  backgroundColor="rgba(0,0,0,0.7)"
                  paddingHorizontal="$3"
                  paddingVertical="$1.5"
                  borderRadius="$5"
                >
                  <Text fontSize={12} color="white" fontWeight="700">
                    {type === "photo" ? "📸 PHOTO" : "🎥 VIDEO"}
                  </Text>
                </Stack>
              </View>
            </View>
          </View>
        </View>

        {/* Buttons Section */}
        <XStack gap="$4" marginTop="$4">
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
      </YStack>
    </ScreenView>
  );
};

const PreviewImage = ({ uri }: { uri: string }) => (
  <Image
    source={{ uri }}
    style={[StyleSheet.absoluteFill, styles.media]}
    contentFit="cover"
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
    <Pressable style={{ flex: 1, overflow: "hidden" }} onPress={togglePlayback}>
      <VideoView
        style={[{ flex: 1 }, styles.media]}
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
  media: {
    borderRadius: 16,
    borderWidth: 5,
    borderColor: "white",
  },
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
