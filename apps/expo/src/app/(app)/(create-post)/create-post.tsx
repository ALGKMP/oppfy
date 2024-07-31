import React, { useState } from "react";
import { StyleSheet } from "react-native";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SMS from "expo-sms";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowBigRight } from "@tamagui/lucide-icons";
import { Controller, useForm } from "react-hook-form";
import { Button, ScrollView, Text, TextArea, View, YStack } from "tamagui";
import { z } from "zod";

import { AlertDialog } from "~/components/Dialogs";
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
  const router = useRouter();

  const params = useLocalSearchParams<
    CreatePostWithRecipient | CreatePostWithPhoneNumber
  >();
  const { type, uri, height, width } = params;

  const [thumbnail, setThumbnail] = useState<string | null>(null);

  const [cancelledDialogVisible, setCancelledDialogVisible] = useState(false);
  const [smsNotAvailableDialogVisible, setSmsNotAvailableDialogVisible] =
    useState(false);

  const { uploadVideoMutation, uploadPhotoMutation } = useUploadMedia();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldTypes>({
    resolver: zodResolver(postSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    setCancelledDialogVisible(false);
    setSmsNotAvailableDialogVisible(false);

    if (params.userType === "notOnApp") {
      const isAvailable = await SMS.isAvailableAsync();

      if (!isAvailable) {
        setSmsNotAvailableDialogVisible(true);
        return;
      }

      // Get a content URI for the file
      const contentUri = await FileSystem.getContentUriAsync(uri ?? "");

      const attachment = {
        uri: contentUri,
        mimeType: type === "photo" ? "image/jpeg" : "video/mp4", // Adjust as needed
        filename: `shared_${type}.${type === "photo" ? "jpg" : "mp4"}`, // Adjust as needed
      } satisfies SMS.SMSAttachment;

      const inviteMessage = `
Hey there! 👋

Your friend has shared an amazing ${type} with you on Oppfy! 🎉

Check out the attached ${type}!

To join the fun and see more great content, download our app:
https://oppfy.com

We can't wait to see you there! 😊
      `.trim();

      const { result } = await SMS.sendSMSAsync(
        [params.number ?? ""],
        inviteMessage,
        {
          attachments: [attachment],
        },
      );

      if (result === "cancelled") {
        setCancelledDialogVisible(true);
        return;
      }
    }

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

      <AlertDialog
        title="Invite not sent"
        subtitle="You must send the SMS for the post to be uploaded."
        onAccept={onSubmit}
        isVisible={cancelledDialogVisible}
        onCancel={() => setCancelledDialogVisible(false)}
      />

      <AlertDialog
        title="SMS not available"
        subtitle="SMS is not available on this device."
        isVisible={smsNotAvailableDialogVisible}
        onCancel={() => setSmsNotAvailableDialogVisible(false)}
      />
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
