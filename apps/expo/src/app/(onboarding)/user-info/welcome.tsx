import React, { useEffect } from "react";
import * as Haptics from "expo-haptics";
import { SplashScreen, useRouter } from "expo-router";
import { H4, Separator, Text, XStack, YGroup, YStack } from "tamagui";

import { H3, ScreenView } from "~/components/ui";
import { BaseScreenView } from "~/components/Views";
import {
  DisclaimerText,
  OnboardingButton,
} from "~/features/onboarding/components";

const Welcome = () => {
  const router = useRouter();
  const onSubmit = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/user-info/full-name");
  };

  useEffect(() => void SplashScreen.hideAsync(), []);

  return (
    <ScreenView safeAreaEdges={["bottom"]} justifyContent="space-between">
      <YStack flex={1} gap="$6">
        <H3 textAlign="center">
          Welcome to OPPFY, a place where roles are reversed.
        </H3>

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

      <OnboardingButton marginHorizontal="$-4" onPress={onSubmit}>
        Become an OPP!
      </OnboardingButton>
    </ScreenView>
  );
};

interface ListItemProp {
  emoji: string;
  title: string;
  subTitle: string;
}

const ListItem = ({ emoji, title, subTitle }: ListItemProp) => {
  return (
    <XStack alignItems="center" gap="$4">
      <Text fontSize={42}>{emoji}</Text>
      <YStack flex={1} gap>
        <H4>{title}</H4>
        <DisclaimerText textAlign="left">{subTitle}</DisclaimerText>
      </YStack>
    </XStack>
  );
};

export default Welcome;
