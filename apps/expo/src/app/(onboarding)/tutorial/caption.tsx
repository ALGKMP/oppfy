import React, { useState } from "react";
import { Dimensions, StyleSheet, TextInput } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowRight, MessageCircle } from "@tamagui/lucide-icons";

import {
  Button,
  H2,
  OnboardingButton,
  Paragraph,
  ScreenView,
  Text,
  View,
  XStack,
  YStack,
} from "~/components/ui";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PREVIEW_WIDTH = SCREEN_WIDTH - 32;
const PREVIEW_HEIGHT = (PREVIEW_WIDTH * 16) / 9;

const EXAMPLE_CAPTIONS = [
  "Check this out! 🔥",
  "You need to see this 👀",
  "Missing you! Join me here",
  "This app is amazing, join me!",
];

const Caption = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    uri: string;
    width: string;
    height: string;
    type: string;
  }>();

  const [caption, setCaption] = useState("");

  const handleContinue = () => {
    router.push({
      pathname: "/tutorial/preview",
      params: {
        ...params,
        caption,
      },
    });
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
          <H2 textAlign="center">Add a Message</H2>
          <Paragraph textAlign="center" color="$gray11">
            Write something to grab their attention
          </Paragraph>
        </YStack>

        {/* Media Preview */}
        <View
          backgroundColor="$gray3"
          borderRadius="$6"
          overflow="hidden"
          animation="quick"
          enterStyle={{
            opacity: 0,
            scale: 0.9,
          }}
        >
          <Image
            source={{ uri: params.uri }}
            style={{
              width: PREVIEW_WIDTH,
              height: PREVIEW_HEIGHT,
            }}
            contentFit="cover"
          />
        </View>

        {/* Caption Input */}
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
            <MessageCircle size={24} color="$primary" />
            <YStack flex={1}>
              <Text color="$gray11" fontSize="$3">
                Add a personal message to make your share more engaging
              </Text>
            </YStack>
          </XStack>

          <View
            backgroundColor="$gray3"
            borderRadius="$6"
            padding="$4"
            animation="quick"
            enterStyle={{
              opacity: 0,
              scale: 0.95,
            }}
          >
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Write your message..."
              multiline
              maxLength={150}
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          {/* Example Captions */}
          <YStack gap="$2">
            <Text fontSize="$3" color="$gray11">
              Suggested messages:
            </Text>
            <XStack flexWrap="wrap" gap="$2">
              {EXAMPLE_CAPTIONS.map((example, index) => (
                <Button
                  key={example}
                  size="$2"
                  variant="outlined"
                  onPress={() => setCaption(example)}
                  animation="quick"
                  enterStyle={{
                    opacity: 0,
                    scale: 0.9,
                  }}
                  animation-delay={`${index * 100}ms`}
                >
                  {example}
                </Button>
              ))}
            </XStack>
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
          icon={ArrowRight}
          onPress={handleContinue}
          disabled={!caption.trim()}
        >
          Continue
        </OnboardingButton>
      </YStack>
    </ScreenView>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 100,
    fontSize: 16,
    textAlignVertical: "top",
    color: "#000",
  },
});

export default Caption;
