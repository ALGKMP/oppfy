import React, { useEffect } from "react";
import * as Haptics from "expo-haptics";
import { SplashScreen, useRouter } from "expo-router";
import { H4, Separator, Text, XStack, YGroup, YStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import {
  DisclaimerText,
  OnboardingButton,
} from "~/features/onboarding/components";

const Welcome = () => {
  const router = useRouter();
  const onSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/user-info/full-name");
  };

  useEffect(() => void SplashScreen.hideAsync(), []);

  return (
    <BaseScreenView paddingHorizontal={0} safeAreaEdges={["bottom"]}>
      <YStack flex={1} paddingHorizontal="$4" gap="$6">
        <DisclaimerText>
          Welcome to OPPFY, a place where roles are reversed.
        </DisclaimerText>
        <YGroup gap="$4">
          <YGroup.Item>
            <ListItem
              emoji="🤝"
              title="Mutual OPP-eration"
              subTitle="Embrace the chaos as you and your friends take turns posting for each other."
            />
          </YGroup.Item>
          <Separator />
          <YGroup.Item>
            <ListItem
              emoji="📷"
              title="Unfiltered Exposure"
              subTitle="Let your squad capture your most real, unedited moments - no filters needed!"
            />
          </YGroup.Item>
          <Separator />
          <YGroup.Item>
            <ListItem
              emoji="💬"
              title="Authentic Engagement"
              subTitle="Comment, react, and vibe with your friends' posts to keep the conversation flowing."
            />
          </YGroup.Item>
          <Separator />
          <YGroup.Item>
            <ListItem
              emoji="🎉"
              title="Living on the Edge"
              subTitle="From embarrassing bloopers to epic adventures, your feed will be a rollercoaster ride."
            />
          </YGroup.Item>
        </YGroup>
      </YStack>
      <OnboardingButton onPress={onSubmit}>Become an OPP!</OnboardingButton>
    </BaseScreenView>
  );
};

interface ListItemProp {
  emoji: string;
  title: string;
  subTitle: string;
}

const ListItem = ({ emoji, title, subTitle }: ListItemProp) => {
  return (
    <XStack alignItems="center" gap="$3">
      <Text fontSize="$10">{emoji}</Text>
      <YStack flex={1} gap>
        <H4>{title}</H4>
        <DisclaimerText textAlign="left">{subTitle}</DisclaimerText>
      </YStack>
    </XStack>
  );
};

export default Welcome;
