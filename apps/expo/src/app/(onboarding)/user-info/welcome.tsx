import React, { useEffect } from "react";
import * as Haptics from "expo-haptics";
import { SplashScreen, useRouter } from "expo-router";

import {
  Group,
  H3,
  H4,
  ScreenView,
  Separator,
  Text,
  XStack,
  YStack,
} from "~/components/ui";
import {
  DisclaimerText,
  OnboardingButton,
} from "~/features/onboarding/components";

const Welcome = () => {
  const router = useRouter();
  const onSubmit = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/user-info/name");
  };

  useEffect(() => void SplashScreen.hideAsync(), []);

  return (
    <ScreenView safeAreaEdges={["bottom"]} justifyContent="space-between">
      <YStack flex={1} gap="$6">
        <H3 textAlign="center">
          Welcome to OPPFY, a place where roles are reversed.
        </H3>

        <Group orientation="vertical" gap="$4">
          <Group.Item>
            <ListItem
              emoji="🤝"
              title="Mutual OPP-eration"
              subTitle="Embrace the chaos as you and your friends take turns posting for each other."
            />
          </Group.Item>
          <Separator />
          <Group.Item>
            <ListItem
              emoji="📷"
              title="Unfiltered Exposure"
              subTitle="Let your squad capture your most real, unedited moments - no filters needed!"
            />
          </Group.Item>
          <Separator />
          <Group.Item>
            <ListItem
              emoji="💬"
              title="Authentic Engagement"
              subTitle="Comment, react, and vibe with your friends' posts to keep the conversation flowing."
            />
          </Group.Item>
          <Separator />
          <Group.Item>
            <ListItem
              emoji="🎉"
              title="Living on the Edge"
              subTitle="From embarrassing bloopers to epic adventures, your feed will be a rollercoaster ride."
            />
          </Group.Item>
        </Group>
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
