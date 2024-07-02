import React from "react";
import { useRouter } from "expo-router";
import { H4, Separator, Text, XStack, YGroup, YStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import {
  DisclaimerText,
  OnboardingButton,
} from "~/features/onboarding/components";

const Welcome = () => {
  const router = useRouter();

  const onSubmit = () => {
    router.push("/user-info/full-name");
  };

  return (
    <BaseScreenView safeAreaEdges={["bottom"]} paddingHorizontal={0}>
      <YStack flex={1} paddingHorizontal="$4" gap="$8">
        <DisclaimerText>
          Welcome to OPPFY, a place where roles are reversed.
        </DisclaimerText>

        <YGroup gap="$4">
          <YGroup.Item>
            <ListItem
              emoji="👋"
              title="Quick Connect"
              subTitle="Dive into a world of ideas trends, and friends waiting one swipe away!"
            />
          </YGroup.Item>

          <Separator />

          <YGroup.Item>
            <ListItem
              emoji="📣"
              title="Speak Up, Stand Out"
              subTitle="Your posts matter. Post, share, and engage make your posts seen."
            />
          </YGroup.Item>

          <Separator />

          <YGroup.Item>
            <ListItem
              emoji="🔒"
              title="Privacy First"
              subTitle="Your space, your rules. Enjoy a safe and respectful community."
            />
          </YGroup.Item>

          <Separator />

          <YGroup.Item>
            <ListItem
              emoji="🎉"
              title="Ever-Evolving Fun"
              subTitle="Fresh features and cool updates always on the horizon."
            />
          </YGroup.Item>

          <Separator />

          <YGroup.Item>
            <ListItem
              emoji="🤝"
              title="We’re Here For You"
              subTitle="Got a question? Our support team’s got your back."
            />
          </YGroup.Item>
        </YGroup>
      </YStack>

      <OnboardingButton onPress={onSubmit}>Continue</OnboardingButton>
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
