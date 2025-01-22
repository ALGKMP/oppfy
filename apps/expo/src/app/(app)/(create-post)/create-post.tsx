import React, { useEffect, useMemo, useRef, useState } from "react";
import type { DimensionValue } from "react-native";
import {
  Dimensions,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
} from "react-native";
import type { TextInput } from "react-native-gesture-handler";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, ScrollText } from "@tamagui/lucide-icons";
import { Controller, useForm } from "react-hook-form";
import { getToken, useTheme } from "tamagui";
import { z } from "zod";

import PlayPause, {
  usePlayPauseAnimations,
} from "~/components/Icons/PlayPause";
import {
  Avatar,
  Button,
  CardContainer,
  H5,
  HeaderTitle,
  ScreenView,
  Text,
  useBottomSheetController,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import { useUploadMedia } from "~/hooks/media";
import type {
  UploadMediaInputNotOnApp,
  UploadMediaInputOnApp,
} from "~/hooks/media/useUploadMedia";
import useStoreReview from "~/hooks/useRating";

interface CreatePostBaseParams extends Record<string, string> {
  uri: string;
  type: "photo" | "video";
  height: string;
  width: string;
}

interface CreatePostWithRecipient extends CreatePostBaseParams {
  recipient: string;
  userType: "onApp";
}

interface CreatePostWithPhoneNumber extends CreatePostBaseParams {
  number: string;
  userType: "notOnApp";
  name: string;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const ASPECT_RATIO = 16 / 9;

const SEND_BUTTON_MESSAGES = [
  (name: string) => `EXPOSE ${name} 📸`,
  (name: string) => `GET ${name} IN HERE 😈`,
  (name: string) => `${name} CAN'T HIDE 👀`,
  (name: string) => `${name} NEEDS THIS 🫣`,
  (name: string) => `PEER PRESSURE ${name} 🎯`,
  (name: string) => `GOTCHA ${name} 😏`,
  (name: string) => `SHOW ${name} WHAT'S UP 🌟`,
  (name: string) => `${name} SHOULD SEE THIS 👋`,
  (name: string) => `TIME TO TAG ${name} 🎯`,
  (name: string) => `BRING ${name} TO THE PARTY 🎈`,
  (name: string) => `${name} WON'T BELIEVE THIS 🤯`,
  (name: string) => `SUMMON ${name} 🔮`,
  (name: string) => `${name} GOTTA SEE THIS 👀`,
  (name: string) => `CALLING ${name} OUT 📢`,
  (name: string) => `${name} WHERE YOU AT? 🗺️`,
];

const CaptionSheet = ({
  caption,
  onSave,
}: {
  caption: string;
  onSave: (text: string) => void;
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [localDraftCaption, setLocalDraftCaption] = useState(caption);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  return (
    <YStack flex={1}>
      <YStack flex={1} padding="$4" gap="$4">
        <XStack justifyContent="space-between">
          <Text fontSize="$6" fontWeight="bold">
            Caption
          </Text>
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$3" color="$gray10">
              {localDraftCaption.length}/255
            </Text>
            <TouchableOpacity onPress={() => setLocalDraftCaption("")}>
              <Ionicons name="close-circle" size={20} color={theme.gray8.val} />
            </TouchableOpacity>
          </XStack>
        </XStack>

        <BottomSheetTextInput
          ref={inputRef}
          placeholder="Write a caption..."
          value={localDraftCaption}
          onChangeText={setLocalDraftCaption}
          multiline
          maxLength={255}
          style={{
            fontWeight: "bold",
            color: theme.color.val,
            backgroundColor: theme.gray5.val,
            padding: getToken("$4", "space") as DimensionValue,
            borderRadius: getToken("$6", "radius") as string,
            height: 100,
            textAlignVertical: "top",
          }}
        />
      </YStack>

      <XStack padding="$4" paddingBottom={insets.bottom}>
        <Button
          flex={1}
          variant="primary"
          disabled={localDraftCaption === caption}
          onPress={() => onSave(localDraftCaption)}
        >
          Save
        </Button>
      </XStack>
    </YStack>
  );
};

const CreatePost = () => {
  const theme = useTheme();
  const router = useRouter();
  const { promptForReview } = useStoreReview();
  const { show, hide } = useBottomSheetController();

  const [caption, setCaption] = useState("");

  const {
    type,
    uri,
    height,
    width,
    recipientName,
    recipientUsername,
    recipientImage,
    ...params
  } = useLocalSearchParams<
    CreatePostWithRecipient | CreatePostWithPhoneNumber
  >();

  const { uploadVideoMutation, uploadPhotoMutation } = useUploadMedia();

  const displayName = useMemo(() => {
    if (params.userType === "onApp") {
      return recipientUsername ?? recipientName ?? "THEM";
    }
    return recipientName?.split(" ")[0] ?? "THEM";
  }, [params.userType, recipientName, recipientUsername]);

  const [buttonMessage] = useState(() => {
    const messageTemplate =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      SEND_BUTTON_MESSAGES[
        Math.floor(Math.random() * SEND_BUTTON_MESSAGES.length)
      ]!;
    return messageTemplate(displayName.toUpperCase());
  });

  const onSubmit = async () => {
    const baseData = {
      uri: uri,
      width: parseInt(width),
      height: parseInt(height),
      caption,
    };

    console.log("params", params);

    const input =
      params.userType === "onApp"
        ? ({
            ...baseData,
            recipient: params.recipient,
            type: "onApp",
          } satisfies UploadMediaInputOnApp)
        : ({
            ...baseData,
            number: params.number,
            type: "notOnApp",
            name: params.name,
          } satisfies UploadMediaInputNotOnApp);

    console.log("before upload", input);

    const postId =
      type === "photo"
        ? await uploadPhotoMutation.mutateAsync(input)
        : await uploadVideoMutation.mutateAsync(input);

    const messageTemplates = [
      "🚨 I JUST EXPOSED YOU! Posted your first pic on Oppfy! Come see what I caught you doing",
      "👀 Caught you in 4K! I created your Oppfy profile & posted your first pic",
      "🔥 Time to expose you on Oppfy! I just put up your first post",
      "😱 YOU'VE BEEN OPPED! I just posted your first picture. Come see what I caught",
      "🫣 I'm making your Oppfy profile blow up & you don't even know it yet",
      "📸 SURPRISE! I'm making you go viral on Oppfy & you're not even on it",
    ];

    const randomMessage =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      messageTemplates[Math.floor(Math.random() * messageTemplates.length)]!;
    const message = `${randomMessage}\n\n💫 Oppfy - Where we post for each other. Download now & get me back 😈\n\nhttps://oppfy.app/post/${postId}`;

    const url = Platform.select({
      ios: `sms:${params.number}&body=${encodeURIComponent(message)}`,
      android: `sms:${params.number}?body=${encodeURIComponent(message)}`,
      default: `sms:${params.number}?body=${encodeURIComponent(message)}`,
    });

    await Linking.openURL(url);

    router.dismissTo("/(app)/(bottom-tabs)/(camera)");
  };

  const openCaptionSheet = () => {
    show({
      title: "Add Caption",
      children: (
        <CaptionSheet
          caption={caption}
          onSave={(text) => {
            setCaption(text);
            hide();
          }}
        />
      ),
    });
  };

  // Calculate the preview size using the same aspect ratio as preview.tsx
  const previewWidth = SCREEN_WIDTH / 3;
  const previewHeight = previewWidth * ASPECT_RATIO;

  return (
    <ScreenView safeAreaEdges={["bottom"]}>
      <YStack flex={1} gap="$5">
        <YStack gap="$4" alignItems="center">
          {type === "photo" ? (
            <Image
              source={{ uri }}
              style={[
                styles.media,
                { width: previewWidth, height: previewHeight },
              ]}
            />
          ) : (
            <PreviewVideo
              uri={uri}
              width={previewWidth}
              height={previewHeight}
            />
          )}

          <XStack gap="$2" alignItems="center">
            <Avatar
              size={28}
              source={recipientImage ?? DefaultProfilePicture}
              bordered
            />
            <Text color="$gray11">
              Posting to{" "}
              <Text fontWeight="bold" color="$primary">
                {params.userType === "onApp" ? "@" : ""}
                {displayName}
              </Text>
            </Text>
          </XStack>
        </YStack>

        <CardContainer padding="$4" paddingBottom="$5">
          <YStack gap="$3">
            <HeaderTitle>Post Details</HeaderTitle>
            <XStack
              justifyContent="space-between"
              alignItems="center"
              onPress={openCaptionSheet}
            >
              <XStack flex={1} alignItems="center" gap="$3" mr="$4">
                <Ionicons
                  name="chatbubble-outline"
                  size={24}
                  color={theme.gray10.val}
                />
                <View flex={1}>
                  <Text fontSize="$5" fontWeight="500">
                    {caption || "Add caption"}
                  </Text>
                </View>
              </XStack>
              <ChevronRight size={24} color="$gray10" />
            </XStack>
          </YStack>
        </CardContainer>
      </YStack>

      <Button
        variant="primary"
        onPress={onSubmit}
        pressStyle={{ scale: 0.95 }}
        animation="bouncy"
      >
        {buttonMessage}
      </Button>
    </ScreenView>
  );
};

const PreviewVideo = ({
  uri,
  width,
  height,
}: {
  uri: string;
  width: number;
  height: number;
}) => {
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
    <Pressable
      onPress={togglePlayback}
      style={[styles.mediaContainer, { width, height }]}
    >
      <VideoView
        style={[styles.media, { width, height }]}
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

const styles = StyleSheet.create({
  media: {
    borderRadius: 24,
  },
  mediaContainer: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
  },
});

export default CreatePost;
