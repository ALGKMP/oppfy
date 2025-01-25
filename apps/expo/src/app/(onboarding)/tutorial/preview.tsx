import React, { useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Send, UserPlus2 } from "@tamagui/lucide-icons";

import {
  Button,
  H2,
  OnboardingButton,
  OnboardingInput,
  Paragraph,
  ScreenView,
  Text,
  View,
  XStack,
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
  }>();

  const [recipientName, setRecipientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const uploadMedia = api.media.uploadMedia.useMutation();

  const handleShare = async () => {
    try {
      await uploadMedia.mutateAsync({
        uri: params.uri,
        width: parseInt(params.width),
        height: parseInt(params.height),
        type: params.type as "photo" | "video",
        caption: params.caption,
        recipientName,
        phoneNumber,
      });

      // Navigate to success screen or home
      router.replace("/(app)/(bottom-tabs)/(camera)");
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  return (
    <ScreenView
      backgroundColor="$background"
      padding="$0"
      justifyContent="space-between"
      keyboardAvoiding
    >
      <YStack flex={1} paddingHorizontal="$4" gap="$6" paddingTop="$8">
        <YStack gap="$2">
          <H2 textAlign="center">Almost Ready!</H2>
          <Paragraph textAlign="center" color="$gray11">
            Preview your share and add your friend's details
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
        <YStack gap="$4">
          <XStack
            backgroundColor="$gray3"
            padding="$4"
            borderRadius="$4"
            gap="$4"
            alignItems="center"
            animation="quick"
            enterStyle={{
              opacity: 0,
              scale: 0.9,
            }}
          >
            <UserPlus2 size={24} color="$primary" />
            <YStack flex={1}>
              <Text color="$gray11" fontSize="$3">
                Enter your friend's details to share this with them
              </Text>
            </YStack>
          </XStack>

          <YStack gap="$4">
            <OnboardingInput
              label="Friend's Name"
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Enter their name"
              autoComplete="name"
              animation="quick"
              enterStyle={{
                opacity: 0,
                x: 20,
              }}
            />

            <OnboardingInput
              label="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter their phone number"
              keyboardType="phone-pad"
              autoComplete="tel"
              animation="quick"
              enterStyle={{
                opacity: 0,
                x: 20,
              }}
              animation-delay="100ms"
            />
          </YStack>
        </YStack>
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
          disabled={!recipientName.trim() || !phoneNumber.trim()}
          loading={uploadMedia.isLoading}
        >
          Share Now
        </OnboardingButton>
      </YStack>
    </ScreenView>
  );
};

export default Preview;
