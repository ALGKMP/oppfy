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

const postSchema = z.object({
  caption: z.string().max(1000),
});

const CreatePost = () => {
  const { uri, type } = useLocalSearchParams<{
    uri: string;
    type: "photo" | "video";
  }>();

  const theme = useTheme();
  const router = useRouter();

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
    setError,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(postSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    console.log(data);
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
                    placeholder="Caption"
                    minHeight="$10"
                    onSubmitEditing={onBlur}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    borderColor={errors.caption ? "$red9" : undefined}
                  />
                )}
              />
              {errors.caption && (
                <Text color="$red9">{errors.caption?.message}</Text>
              )}
            </YStack>
          </YStack>
        </ScrollView>
      </View>

      <XStack
        paddingTop="$4"
        paddingHorizontal="$4"
        justifyContent="space-evenly"
        backgroundColor={"$gray2"}
        borderTopLeftRadius={36}
        borderTopRightRadius={36}
        gap="$4"
      >
        <Button
          flex={1}
          size={"$5"}
          borderRadius="$8"
          icon={ArrowBigLeft}
          onPress={() => router.back()}
        >
          Back
        </Button>

        <Button
          flex={2}
          size={"$5"}
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
