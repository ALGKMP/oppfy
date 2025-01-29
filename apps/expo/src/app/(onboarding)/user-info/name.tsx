import React, { useState } from "react";
import { TextInput } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ChevronRight } from "@tamagui/lucide-icons";
import { getTokens } from "tamagui";

import { sharedValidators } from "@oppfy/validators";

import {
  Button,
  ScreenView,
  Text,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import { api } from "~/utils/api";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const AnimatedYStack = Animated.createAnimatedComponent(YStack);
const AnimatedXStack = Animated.createAnimatedComponent(XStack);

export default function Name() {
  const router = useRouter();
  const tokens = getTokens();
  const [name, setName] = useState("");
  const updateProfile = api.profile.updateProfile.useMutation();

  const isValidName = sharedValidators.user.name.safeParse(name).success;

  const handleSubmit = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateProfile.mutateAsync({ name });
    router.push("/user-info/username");
  };

  return (
    <ScreenView
      keyboardAvoiding
      safeAreaEdges={["bottom"]}
      paddingHorizontal="$6"
      justifyContent="space-between"
    >
      <YStack gap="$8" paddingTop="$8">
        <AnimatedYStack gap="$2" entering={FadeIn.delay(200)}>
          <Text
            color="rgba(255,255,255,0.7)"
            fontSize="$6"
            textAlign="center"
            fontWeight="600"
          >
            Welcome to Oppfy
          </Text>
          <Text
            color="white"
            fontSize="$9"
            lineHeight={40}
            textAlign="center"
            fontWeight="800"
          >
            What's your name?
          </Text>
        </AnimatedYStack>

        <AnimatedTextInput
          value={name}
          onChangeText={setName}
          entering={FadeIn.delay(400)}
          placeholder="Enter your name"
          placeholderTextColor="rgba(255,255,255,0.4)"
          style={{
            fontSize: 24,
            color: "#fff",
            textAlign: "center",
            fontWeight: "500",
            padding: 16,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 16,
          }}
          autoFocus
          autoCorrect={false}
          maxLength={50}
        />
      </YStack>

      <AnimatedXStack entering={FadeIn.delay(600)}>
        <Button
          flex={1}
          backgroundColor={isValidName ? "white" : "rgba(255,255,255,0)"}
          borderRadius="$10"
          disabled={!isValidName}
          pressStyle={{
            scale: 0.97,
            backgroundColor: "white",
          }}
          onPress={handleSubmit}
          animation="medium"
        >
          <XStack gap="$2" alignItems="center" justifyContent="center">
            <Text
              color={isValidName ? tokens.color.primary.val : "white"}
              fontSize="$6"
              fontWeight="600"
            >
              Continue
            </Text>
            <ChevronRight
              size={20}
              color={isValidName ? tokens.color.primary.val : "white"}
            />
          </XStack>
        </Button>
      </AnimatedXStack>
    </ScreenView>
  );
}
