import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Send } from "@tamagui/lucide-icons";

import {
  H2,
  OnboardingButton,
  Paragraph,
  ScreenView,
  Text,
  View,
  YStack,
} from "~/components/ui";
import { api } from "~/utils/api";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PREVIEW_WIDTH = SCREEN_WIDTH - 32;
const PREVIEW_HEIGHT = (PREVIEW_WIDTH * 16) / 9;

const Preview = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    uri: string;
    width: string;
    height: string;
    type: string;
    caption: string;
    name: string;
    number: string;
    recipientName: string;
    recipientImage?: string;
  }>();

  const uploadPicturePostForUserNotOnApp =
    api.post.uploadPicturePostForUserNotOnApp.useMutation();
  const uploadVideoPostForUserNotOnApp =
    api.post.uploadVideoPostForUserNotOnApp.useMutation();

  const handleShare = async () => {
    try {
      if (params.type === "video") {
        await uploadVideoPostForUserNotOnApp.mutateAsync({
          number: params.number,
          name: params.name,
          caption: params.caption,
          width: params.width,
          height: params.height,
        });
      } else {
        const response = await fetch(params.uri);
        const blob = await response.blob();

        await uploadPicturePostForUserNotOnApp.mutateAsync({
          number: params.number,
          name: params.name,
          caption: params.caption,
          width: params.width,
          height: params.height,
          contentLength: blob.size,
          contentType: blob.type as "image/jpeg" | "image/png",
        });
      }

      // Navigate to success screen or home
      router.replace("/(app)/(bottom-tabs)/(camera)");
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  const isLoading =
    uploadPicturePostForUserNotOnApp.status === "pending" ||
    uploadVideoPostForUserNotOnApp.status === "pending";

  return (
    <ScreenView
      backgroundColor="$background"
      padding="$0"
      justifyContent="space-between"
      keyboardAvoiding
    >
      <YStack flex={1} paddingHorizontal="$4" gap="$6" paddingTop="$8">
        <YStack gap="$2">
          <H2 textAlign="center">Ready to Share!</H2>
          <Paragraph textAlign="center" color="$gray11">
            Preview your share for {params.name}
          </Paragraph>
        </YStack>

        {/* Share Preview */}
        <View
          backgroundColor="$gray3"
          borderRadius="$6"
          padding="$4"
          gap="$4"
          animation="quick"
          enterStyle={{
            opacity: 0,
            scale: 0.9,
          }}
        >
          <Image
            source={{ uri: params.uri }}
            style={{
              width: PREVIEW_WIDTH - 32,
              height: PREVIEW_HEIGHT - 32,
              borderRadius: 16,
            }}
            contentFit="cover"
          />
          <Text fontSize="$4" fontWeight="500">
            {params.caption}
          </Text>
        </View>

        {/* Recipient Info */}
        <View
          backgroundColor="$gray3"
          borderRadius="$6"
          padding="$4"
          gap="$4"
          animation="quick"
          enterStyle={{
            opacity: 0,
            scale: 0.9,
          }}
        >
          <Text fontSize="$4" fontWeight="500">
            Sharing with:
          </Text>
          <Text fontSize="$5" color="$gray11">
            {params.name}
          </Text>
          <Text fontSize="$4" color="$gray11">
            {params.number}
          </Text>
        </View>
      </YStack>

      {/* Bottom Button */}
      <YStack
        padding="$4"
        paddingBottom="$6"
        backgroundColor="$background"
        borderTopWidth={1}
        borderTopColor="$gray5"
      >
        <OnboardingButton
          icon={Send}
          onPress={handleShare}
          disabled={isLoading}
        >
          Share Now
        </OnboardingButton>
      </YStack>
    </ScreenView>
  );
};

export default Preview;
