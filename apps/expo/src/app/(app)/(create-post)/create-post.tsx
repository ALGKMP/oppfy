import React, { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import type { TextInput } from "react-native-gesture-handler";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowBigRight, Minus } from "@tamagui/lucide-icons";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  H5,
  ScrollView,
  SizableText,
  Text,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";
import { z } from "zod";

import { BaseScreenView } from "~/components/Views";
import { useUploadMedia } from "~/hooks/media";
import {
  CONTENT_SPACING,
  SAFE_AREA_PADDING,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "~/constants/camera";

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

const TARGET_ASPECT_RATIO = 9 / 16; // Assuming portrait orientation
const MAX_CONTENT_HEIGHT = SCREEN_WIDTH / TARGET_ASPECT_RATIO;

const CreatePost = () => {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { type, uri, height, width, ...params } = useLocalSearchParams<
    CreatePostWithRecipient | CreatePostWithPhoneNumber
  >();

  const videoRef = useRef<Video>(null);
  const inputRef = useRef<TextInput>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [isPlaying, setIsPlaying] = useState(false);

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

  const [inputValue, setInputValue] = useState("");
  const [isFieldChanged, setIsFieldChanged] = useState(false);

  const onSubmit = handleSubmit(async (data) => {
    const baseData = {
      uri: uri ?? "",
      width: Number(width),
      height: Number(height),
      caption: data.caption,
    };
    const input =
      params.userType === "onApp"
        ? {
            ...baseData,
            recipient: params.recipient ?? "",
            type: "onApp" as const,
          }
        : {
            ...baseData,
            number: params.number ?? "",
            type: "notOnApp" as const,
          };
    type === "photo"
      ? await uploadPhotoMutation.mutateAsync(input)
      : await uploadVideoMutation.mutateAsync(input);
    router.dismissAll();
    router.navigate("/(home)");
  });

  const togglePlayback = async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const openBottomSheet = () => {
    setInputValue(watch("caption") ?? "");
    setIsFieldChanged(false);
    bottomSheetRef.current?.expand();
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
  };

  // Calculate the aspect ratio of the content
  const contentAspectRatio =
    parseFloat(width ?? "0") / parseFloat(height ?? "0");

  // Determine the actual content height, constrained by MAX_CONTENT_HEIGHT
  const contentHeight = Math.min(
    SCREEN_WIDTH / contentAspectRatio,
    MAX_CONTENT_HEIGHT,
  );

  // Calculate the preview size (1/3 of the original size)
  const previewWidth = SCREEN_WIDTH / 3;
  const previewHeight = contentHeight / 3;

  return (
    <>
      <BaseScreenView safeAreaEdges={["bottom"]}>
        <View flex={1}>
          <ScrollView flex={1} keyboardDismissMode="interactive">
            <YStack flex={1} gap="$4">
              <View alignItems="center">
                {type === "photo" ? (
                  <Image
                    source={{ uri }}
                    style={[
                      styles.media,
                      { width: previewWidth, height: previewHeight },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.mediaContainer,
                      { width: previewWidth, height: previewHeight },
                    ]}
                  >
                    <Video
                      ref={videoRef}
                      source={{ uri: uri ?? "" }}
                      style={[
                        styles.media,
                        { width: previewWidth, height: previewHeight },
                      ]}
                      resizeMode={ResizeMode.COVER}
                      isLooping
                      shouldPlay={false}
                    />
                    <Pressable
                      onPress={togglePlayback}
                      style={styles.playButtonContainer}
                    >
                      <View style={styles.playButton}>
                        <Ionicons
                          name={isPlaying ? "pause" : "play"}
                          size={24}
                          color="white"
                        />
                      </View>
                    </Pressable>
                  </View>
                )}
              </View>
              <YStack flex={1} gap="$2">
                <TouchableOpacity onPress={openBottomSheet}>
                  <XStack justifyContent="space-between" alignItems="center">
                    <H5>{watch("caption") ? "Edit caption" : "Add caption"}</H5>
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={theme.gray10.val}
                    />
                  </XStack>
                </TouchableOpacity>
              </YStack>
            </YStack>
          </ScrollView>
        </View>
        <Button
          size="$5"
          borderRadius="$7"
          iconAfter={ArrowBigRight}
          onPress={onSubmit}
        >
          Continue
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
              <View
                onLayout={() => {
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <BottomSheetTextInput
                  ref={inputRef}
                  autoFocus
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
              </View>
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

const styles = StyleSheet.create({
  media: {
    borderRadius: 24,
  },
  mediaContainer: {
    position: "relative",
  },
  playButtonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 24,
    padding: 8,
  },
});

export default CreatePost;