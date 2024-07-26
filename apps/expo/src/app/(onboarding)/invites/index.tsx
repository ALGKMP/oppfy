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

import {
  OnboardingButton,
  OnboardingInput,
} from "~/features/onboarding/components";

const Header = () => (
  <YStack padding="$4" gap="$4">
    <YStack alignItems="center" gap="$4">
      <Text color="white" fontSize="$8" fontWeight="bold">
        invite only
      </Text>

      <Button backgroundColor="#F214FF" borderRadius="$10">
        <Text>POST FOR 5 FRIENDS</Text>
      </Button>
    </YStack>

    <XStack justifyContent="space-between" paddingVertical="$4">
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
      backgroundColor="$blue8"
      borderRadius="$10"
      padding="$2"
    >
      <Input
        placeholder="Your 5 best friends 🔍"
        placeholderTextColor="$blue10"
        color="$blue10"
        backgroundColor="transparent"
        borderWidth={0}
      />
      <Text color="$blue10">0/5</Text>
    </XStack>
  </YStack>
);

const FriendItem = ({ item }: { item: { id: number } }) => (
  <XStack justifyContent="space-between" alignItems="center" padding="$2">
    <XStack gap="$2" alignItems="center">
      <Circle size="$4" backgroundColor="$gray8" />
      <Text color="white">Friend {item.id}</Text>
    </XStack>
    <Button variant="outlined" size="$2">
      <Text>Invite</Text>
    </Button>
  </XStack>
);

const InvitePage = () => {
  const friends = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));
  const theme = useTheme();

  return (
    <View flex={1} backgroundColor={theme.background.val}>
      <FlashList
        data={friends}
        renderItem={({ item }) => <FriendItem item={item} />}
        estimatedItemSize={50}
        ListHeaderComponent={Header}
        // ListFooterComponent={Footer}
      />
      {/* <Footer /> */}
    </View>
  );
};

export default InvitePage;
