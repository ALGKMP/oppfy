import React, { useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SMS from "expo-sms";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowBigRight } from "@tamagui/lucide-icons";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  Dialog,
  ScrollView,
  Text,
  TextArea,
  View,
  YStack,
} from "tamagui";
import { z } from "zod";

import { BaseScreenView } from "~/components/Views";
import { useUploadMedia } from "~/hooks/media";

const postSchema = z.object({
  caption: z.optional(z.string().max(1000)),
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

const CreatePost = () => {
  const params = useLocalSearchParams<
    CreatePostWithRecipient | CreatePostWithPhoneNumber
  >();
  const { type, uri, height, width } = params;
  const router = useRouter();
  const { uploadVideoMutation, uploadPhotoMutation } = useUploadMedia();
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [showSmsDialog, setShowSmsDialog] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldTypes>({
    resolver: zodResolver(postSchema),
  });

  const sendSMS = async (number: string, message: string) => {
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      const { result } = await SMS.sendSMSAsync([number], message);
      console.log(result);
    } else {
      console.log("SMS is not available on this device");
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    const baseData = {
      uri: uri ?? "",
      width: Number(width),
      height: Number(height),
      caption: data.caption,
    };

    if (params.userType === "notOnApp") {
      setShowSmsDialog(true);
    } else {
      await uploadMedia(baseData, params);
    }
  });

  const uploadMedia = async (baseData: any, params: any) => {
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
    router.navigate("/(home)/home");
  };

  const handleSendSMS = async () => {
    if (params.userType === "notOnApp") {
      await sendSMS(
        params.number,
        "Hey! I've shared a post with you. Download our app to view it!",
      );
      await uploadMedia(
        {
          uri: uri ?? "",
          width: Number(width),
          height: Number(height),
          caption: control._formValues.caption,
        },
        params,
      );
    }
    setShowSmsDialog(false);
  };

  return (
    <BaseScreenView safeAreaEdges={["bottom"]}>
      <View flex={1}>
        <ScrollView flex={1} keyboardDismissMode="interactive">
          <YStack flex={1} gap="$4">
            <Image source={{ uri: thumbnail ?? uri }} style={styles.media} />
            <YStack flex={1} gap="$2">
              <Controller
                control={control}
                name="caption"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextArea
                    minHeight="$10"
                    placeholder="Caption"
                    keyboardType="twitter"
                    borderColor={errors.caption ? "$red9" : undefined}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.caption && (
                <Text color="$red9">{errors.caption.message}</Text>
              )}
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

      <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            bordered
            elevate
            key="content"
            animation={[
              "quick",
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            gap="$4"
          >
            <Dialog.Title>Send SMS</Dialog.Title>
            <Dialog.Description>
              This user is not on the app. We need to send them an SMS to invite
              them to view your post.
            </Dialog.Description>
            <YStack gap="$3">
              <Button onPress={handleSendSMS} theme="active">
                Send SMS and Post
              </Button>
              <Button onPress={() => setShowSmsDialog(false)} theme="alt1">
                Cancel
              </Button>
            </YStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </BaseScreenView>
  );
};

const styles = StyleSheet.create({
  media: {
    flex: 1,
    minWidth: 140,
    minHeight: 200,
    maxWidth: 140,
    maxHeight: 200,
    borderRadius: 24,
  },
});

export default CreatePost;
