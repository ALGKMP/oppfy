import React from "react";
import { FlashList } from "@shopify/flash-list";
import { UserRoundPlus } from "@tamagui/lucide-icons";
import {
  Button,
  Circle,
  Input,
  Text,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";

import { BaseScreenView, KeyboardSafeView } from "~/components/Views";
import {
  OnboardingButton,
  OnboardingInput,
} from "~/features/onboarding/components";

const Header = () => (
  <YStack padding="$4" gap="$4">
    <YStack alignItems="center" gap="$4">
      <Text color="white" fontSize="$8" fontStyle="normal">
        Invite Only
      </Text>
    </YStack>

    <XStack justifyContent="space-between">
      {[1, 2, 3].map((_, index) => (
        <YStack key={index} alignItems="center" gap="$2">
          <Circle size="$6" borderColor="$gray8" borderWidth={1}>
            <UserRoundPlus size="$2" marginLeft="$1" />
          </Circle>
          <Text color="$gray11" fontSize="$2">
            No friend
          </Text>
          <Text color="$gray11" fontSize="$2">
            Posted for yet
          </Text>
        </YStack>
      ))}
    </XStack>
    <Search />
  </YStack>
);

const Search = () => (
  <YStack>
    <XStack
      alignItems="center"
      justifyContent="center"
      //   backgroundColor="$blue8"
      backgroundColor="#F214FF"
      borderRadius="$10"
      padding="$2"
    >
      <Input
        placeholder={"Your 3 best friends 🔍" + " 0/3"}
        placeholderTextColor="white"
        // color="$blue10"
        backgroundColor="transparent"
        borderWidth={0}
      />
    </XStack>
  </YStack>
);

const FriendItem = ({ item }: { item: { id: number } }) => (
  <XStack justifyContent="space-between" alignItems="center" padding="$2">
    <XStack gap="$2" alignItems="center">
      <Circle size="$4" backgroundColor="$gray8" />
      <Text color="white">Friend {item.id}</Text>
    </XStack>
    <Button size="$2">
      <Text>Invite</Text>
    </Button>
  </XStack>
);

const InvitePage = () => {
  const friends = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));
  const theme = useTheme();

  return (
    <KeyboardSafeView>
      <BaseScreenView
        backgroundColor="$background"
        paddingBottom={0}
        safeAreaEdges={["bottom"]}
        paddingHorizontal={0}
      >
        <View flex={1} backgroundColor={theme.background.val}>
          <View flex={1} paddingHorizontal="$4">
            <FlashList
              data={friends}
              renderItem={({ item }) => <FriendItem item={item} />}
              estimatedItemSize={50}
              ListHeaderComponent={Header}
              // ListFooterComponent={Footer}
            />
          </View>
          <OnboardingButton onPress={() => {}}>CONTINUE</OnboardingButton>
        </View>
      </BaseScreenView>
    </KeyboardSafeView>
  );
};

export default InvitePage;
