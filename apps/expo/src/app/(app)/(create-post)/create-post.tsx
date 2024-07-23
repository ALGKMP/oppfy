import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowBigRight } from "@tamagui/lucide-icons";
import { Controller, useForm } from "react-hook-form";
import { Button, ScrollView, Text, TextArea, View, YStack } from "tamagui";
import { z } from "zod";

import { BaseScreenView } from "~/components/Views";
import { useUploadMedia } from "~/hooks/media";
import type { UploadMediaInput } from "~/hooks/media";

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

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldTypes>({
    resolver: zodResolver(postSchema),
  });

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
    router.navigate("/(home)/home");
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
