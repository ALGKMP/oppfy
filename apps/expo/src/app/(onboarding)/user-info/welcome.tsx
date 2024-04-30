import React from "react";
import { useRouter } from "expo-router";
import { Button, Separator, Text, View, XStack, YGroup, YStack } from "tamagui";

const Welcome = () => {
  const router = useRouter();

  const onSubmit = () => {
    router.push("/user-info/full-name");
  };

  return (
    <View flex={1} padding="$4" backgroundColor="$background">
      <YStack flex={1} gap="$8">
        <Text
          alignSelf="center"
          textAlign="center"
          color="$gray9"
          fontWeight="bold"
        >
          Welcome to OPPFY, a place where roles are reversed.
        </Text>

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

      <Button onPress={onSubmit}>Continue</Button>
    </View>
  );
};

interface ListItemProp {
  emoji: string;
  title: string;
  subTitle: string;
}

const ListItem = ({ emoji, title, subTitle }: ListItemProp) => {
  return (
    <XStack alignItems="center" gap="$2">
      <Text fontSize="$10">{emoji}</Text>

      <YStack flex={1} gap>
        <Text fontSize="$7" fontWeight="bold">
          {title}
        </Text>
        <Text color="$gray9">{subTitle}</Text>
      </YStack>
    </XStack>
  );
};

export default Welcome;
