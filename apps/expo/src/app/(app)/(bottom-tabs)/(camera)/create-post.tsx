import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as VideoThumbnails from "expo-video-thumbnails";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowBigLeft, ArrowBigRight } from "@tamagui/lucide-icons";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  ScrollView,
  Text,
  TextArea,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";
import { z } from "zod";

import { BaseScreenView } from "~/components/Views";
import { useUploadMedia } from "~/hooks/media";
import type { UploadMediaInput } from "~/hooks/media";

const postSchema = z.object({
  caption: z.optional(z.string().max(1000)),
});

type FieldTypes = z.infer<typeof postSchema>;

const CreatePost = () => {
  const { recipientId, type, uri, height, width } = useLocalSearchParams<{
    recipientId: string;
    uri: string;
    type: "photo" | "video";
    height: string;
    width: string;
  }>();

  const theme = useTheme();
  const router = useRouter();

  const { uploadVideoMutation, uploadPhotoMutation } = useUploadMedia();

  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    const generateThumbnail = async () => {
      const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(
        uri ?? "",
      );
      setThumbnail(thumbnailUri);
    };

    if (type === "video") {
      void generateThumbnail();
    }
  }, [type, uri]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldTypes>({
    resolver: zodResolver(postSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    const input = {
      recipientId: recipientId ?? "",
      uri: uri ?? "",
      width: Number(width),
      height: Number(height),
      caption: data.caption,
    } satisfies UploadMediaInput;

    type === "photo"
      ? await uploadPhotoMutation.mutateAsync(input)
      : await uploadVideoMutation.mutateAsync(input);

    router.dismissAll();
    router.navigate("/(profile)/self-profile");
  });

  return (
    <BaseScreenView
      paddingBottom={0}
      paddingHorizontal={0}
      safeAreaEdges={["bottom"]}
      bottomSafeAreaStyle={{
        backgroundColor: theme.gray2.val,
      }}
    >
      <View flex={1} paddingHorizontal="$4">
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
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    borderColor={errors.caption ? "$red9" : undefined}
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

      <XStack
        paddingTop="$4"
        paddingHorizontal="$4"
        justifyContent="space-evenly"
        backgroundColor="$gray2"
        borderTopLeftRadius={36}
        borderTopRightRadius={36}
        gap="$4"
      >
        <Button
          flex={1}
          size="$5"
          borderRadius="$8"
          icon={ArrowBigLeft}
          onPress={() => router.back()}
        >
          Back
        </Button>

        <Button
          flex={2}
          size="$5"
          borderRadius="$8"
          iconAfter={ArrowBigRight}
          onPress={onSubmit}
        >
          Continue
        </Button>
      </XStack>
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
