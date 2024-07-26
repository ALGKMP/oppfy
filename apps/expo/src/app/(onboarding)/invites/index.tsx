import React from "react";
import { FlashList } from "@shopify/flash-list";
import { UserRound, UserRoundPlus } from "@tamagui/lucide-icons";
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

const Header = () => (
  <YStack padding="$4" gap="$4">
    <Text color="$gray11">Help</Text>

    <YStack alignItems="center" gap="$4">
      <Text color="white" fontSize="$8" fontWeight="300">
        Oppfy is
      </Text>
      <Text color="white" fontSize="$8" fontWeight="300" fontStyle="italic">
        invite only
      </Text>

      <Button backgroundColor="#F214FF" borderRadius="$10">
        <Text>INVITE 5 FRIENDS</Text>
      </Button>
    </YStack>

    <XStack justifyContent="space-between" paddingVertical="$4">
      {[1, 2, 3].map((_, index) => (
        <YStack key={index} alignItems="center" gap="$2">
          <Circle size="$6" borderColor="$gray8" borderWidth={1}>
            <UserRoundPlus size="$2" marginLeft="$1"/>
          </Circle>
          <Text color="$gray11" fontSize="$2">
            No friend
          </Text>
          <Text color="$gray11" fontSize="$2">
            invited yet
          </Text>
        </YStack>
      ))}
    </XStack>

    <Button color="$blue10">
      <Text>Why 5 friends?</Text>
    </Button>
  </YStack>
);

const Footer = () => (
  <YStack padding="$4">
    <XStack alignItems="center">
      <Text>🔍</Text>
      <Input
        placeholder="Your 5 best friends"
        placeholderTextColor="$blue10"
        color="$blue10"
        backgroundColor="$blue5"
        borderRadius="$10"
        height="$5"
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
      <Header />
      <FlashList
        data={friends}
        renderItem={({ item }) => <FriendItem item={item} />}
        estimatedItemSize={50}
        // ListHeaderComponent={Header}
        ListFooterComponent={Footer}
      />
    </View>
  );
};

export default InvitePage;
