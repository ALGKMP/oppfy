import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  View as RNView,
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
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowBigRight, ChevronRight, Minus } from "@tamagui/lucide-icons";
import { Controller, useForm } from "react-hook-form";
import { useTheme } from "tamagui";
import { z } from "zod";

import CardContainer from "~/components/Containers/CardContainer";
import PlayPause, {
  usePlayPauseAnimations,
} from "~/components/Icons/PlayPause";
import {
  Button,
  H5,
  ScrollView,
  SizableText,
  Text,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import { BaseScreenView } from "~/components/Views";
import { useUploadMedia } from "~/hooks/media";
import {
  UploadMediaInputNotOnApp,
  UploadMediaInputOnApp,
} from "~/hooks/media/useUploadMedia";
import useStoreReview from "~/hooks/useRating";

const postSchema = z.object({
  caption: z.optional(z.string().max(255)),
});

type FieldTypes = z.infer<typeof postSchema>;

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
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const ASPECT_RATIO = 16 / 9;

const SEND_BUTTON_MESSAGES = [
  (name: string) => `EXPOSE ${name.toUpperCase()} 📸`,
  (name: string) => `GET ${name.toUpperCase()} IN HERE 😈`,
  (name: string) => `${name.toUpperCase()} CAN'T HIDE 👀`,
  (name: string) => `${name.toUpperCase()} NEEDS THIS 🫣`,
  (name: string) => `PEER PRESSURE ${name.toUpperCase()} 🎯`,
  (name: string) => `${name.toUpperCase()} IS MISSING OUT 💅`,
  (name: string) => `GOTCHA ${name.toUpperCase()} 😏`,
  (name: string) => `SHOW ${name.toUpperCase()} WHAT'S UP 🌟`,
  (name: string) => `${name.toUpperCase()} SHOULD SEE THIS 👋`,
  (name: string) => `TIME TO TAG ${name.toUpperCase()} 🎯`,
  (name: string) => `BRING ${name.toUpperCase()} TO THE PARTY 🎈`,
  (name: string) => `${name.toUpperCase()} WON'T BELIEVE THIS 🤯`,
  (name: string) => `SUMMON ${name.toUpperCase()} 🔮`,
  (name: string) => `${name.toUpperCase()} GOTTA SEE THIS 👀`,
  (name: string) => `CALLING ${name.toUpperCase()} OUT 📢`,
  (name: string) => `${name.toUpperCase()} WHERE YOU AT? 🗺️`,
];

const CreatePost = () => {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { promptForReview } = useStoreReview();

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

  const displayName = useMemo(() => {
    if (params.userType === "onApp") {
      return recipientUsername ?? recipientName ?? "THEM";
    }
    return recipientName?.split(" ")[0] ?? "THEM";
  }, [params.userType, recipientName, recipientUsername]);

  const [buttonMessage] = useState(() => {
    const messageTemplate =
      SEND_BUTTON_MESSAGES[
        Math.floor(Math.random() * SEND_BUTTON_MESSAGES.length)
      ]!;
    return messageTemplate(displayName);
  });

  const inputRef = useRef<TextInput>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [inputValue, setInputValue] = useState("");
  const [isFieldChanged, setIsFieldChanged] = useState(false);

  const { uploadVideoMutation, uploadPhotoMutation } = useUploadMedia();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FieldTypes>({
    resolver: zodResolver(postSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    const baseData = {
      uri: uri,
      width: parseInt(width),
      height: parseInt(height),
      caption: data.caption,
    };
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
          } satisfies UploadMediaInputNotOnApp);

    type === "photo"
      ? void uploadPhotoMutation.mutateAsync(input)
      : void uploadVideoMutation.mutateAsync(input);

    await promptForReview();

    router.dismissAll();
    router.navigate("/(app)/(bottom-tabs)/(home)");
  });

  const openBottomSheet = () => {
    setInputValue(watch("caption") ?? "");
    setIsFieldChanged(false);
    bottomSheetRef.current?.expand();
    inputRef.current?.focus();
  };

  const clearInput = () => {
    setInputValue("");
    setIsFieldChanged(true);
  };

  const renderHeader = useCallback(() => {
    return (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        position="relative"
      >
        <Minus size="$4" />
        <View justifyContent="center" alignItems="center">
          <SizableText size="$5" textAlign="center" fontWeight="bold">
            Add Caption
          </SizableText>
        </View>
        <View
          width="95%"
          borderColor="$gray8"
          borderWidth="$0.25"
          marginTop="$3"
        />
      </YStack>
    );
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        {...props}
      />
    ),
    [],
  );

  const handleSave = () => {
    if (isFieldChanged) {
      setValue("caption", inputValue);
      bottomSheetRef.current?.close();
    }
  };

  const handleSheetClose = () => {
    setInputValue("");
    setIsFieldChanged(false);
    inputRef.current?.blur();
  };

  // Calculate the preview size using the same aspect ratio as preview.tsx
  const previewWidth = SCREEN_WIDTH / 3;
  const previewHeight = previewWidth * ASPECT_RATIO;

  return (
    <>
      <BaseScreenView safeAreaEdges={["bottom"]}>
        <ScrollView>
          <YStack gap="$5">
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
                <Image
                  source={recipientImage ?? DefaultProfilePicture}
                  style={{ width: 24, height: 24, borderRadius: 12 }}
                />
                <Text color="$gray11">
                  Posting to {params.userType === "onApp" ? "@" : ""}
                  {displayName}
                </Text>
              </XStack>
            </YStack>

            <CardContainer padding="$4" paddingBottom="$5">
              <YStack gap="$3">
                <H5>Post Details</H5>
                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  onPress={openBottomSheet}
                >
                  <XStack flex={1} alignItems="center" gap="$3" mr="$4">
                    <Ionicons
                      name="chatbubble-outline"
                      size={24}
                      color={theme.gray10.val}
                    />
                    <View flex={1}>
                      <Text fontSize="$5" fontWeight="500">
                        {watch("caption") ? watch("caption") : "Add caption"}
                      </Text>
                    </View>
                  </XStack>
                  <ChevronRight size={24} color="$gray10" />
                </XStack>
              </YStack>
            </CardContainer>
          </YStack>
        </ScrollView>

        <Button
          variant="primary"
          iconAfter={ChevronRight}
          onPress={onSubmit}
          pressStyle={{ scale: 0.97 }}
          animation="bouncy"
        >
          {buttonMessage}
        </Button>
      </BaseScreenView>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["50%"]}
        enablePanDownToClose
        keyboardBlurBehavior="restore"
        onClose={handleSheetClose}
        handleComponent={renderHeader}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.gray4.val }}
      >
        <YStack flex={1} padding="$4" gap="$4">
          <XStack justifyContent="space-between">
            <Text fontSize="$6" fontWeight="bold">
              Caption
            </Text>
            <XStack alignItems="center" gap="$2">
              <Text fontSize="$3" color="$gray10">
                {inputValue.length}/255
              </Text>
              <TouchableOpacity onPress={clearInput}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.gray8.val}
                />
              </TouchableOpacity>
            </XStack>
          </XStack>
          <Controller
            control={control}
            name="caption"
            render={({ field: { onBlur } }) => (
              <RNView>
                <BottomSheetTextInput
                  ref={inputRef}
                  placeholder="Write a caption..."
                  onBlur={onBlur}
                  value={inputValue}
                  onChangeText={(text) => {
                    setInputValue(text);
                    setIsFieldChanged(text !== watch("caption"));
                  }}
                  multiline
                  maxLength={255}
                  style={{
                    fontWeight: "bold",
                    justifyContent: "flex-start",
                    color: theme.color.val,
                    backgroundColor: theme.gray5.val,
                    padding: 20,
                    borderRadius: 20,
                  }}
                />
              </RNView>
            )}
          />
          {errors.caption && (
            <Text color="$red8">{errors.caption.message}</Text>
          )}
        </YStack>
        <XStack padding="$4" paddingBottom={insets.bottom}>
          <Button
            flex={1}
            size="$5"
            borderRadius="$7"
            onPress={handleSave}
            disabled={!isFieldChanged}
            opacity={isFieldChanged ? 1 : 0.5}
          >
            Save
          </Button>
        </XStack>
      </BottomSheet>
    </>
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
