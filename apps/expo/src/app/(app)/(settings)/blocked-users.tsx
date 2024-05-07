import { useEffect, useState } from "react";
import * as FileSystem from "expo-file-system";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import {
  ChevronRight,
  MessageCircle,
  UserRoundX,
  XCircle,
} from "@tamagui/lucide-icons";
import {
  Avatar,
  Button,
  Paragraph,
  SizableText,
  Text,
  View,
  YStack,
} from "tamagui";

import type { SettingsGroup, SettingsItem } from "~/components/Settings";
import { renderSettingsGroup } from "~/components/Settings";
import type { ButtonOption } from "~/components/Sheets";
import { ActionSheet } from "~/components/Sheets";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { ScreenBaseView } from "~/components/Views";
import { useSession } from "~/contexts/SessionContext";
import { api } from "~/utils/api";

// const test = {
//   title: "Christina",
//   subtitle: "christinaikl",
//   icon: (
//     <Avatar circular size="$5">
//       <Avatar.Image
//         accessibilityLabel="Cam"
//         src="https://images.unsplash.com/photo-1548142813-c348350df52b?&w=150&h=150&dpr=2&q=80"
//       />
//       <Avatar.Fallback backgroundColor="$blue10" />
//     </Avatar>
//   ),
//   iconAfter: (
//     <Button icon={<UserRoundX size="$1" />} size="$4">
//       Unblock
//     </Button>
//   ),
//   pressTheme: false,
//   hoverTheme: false,
// } satisfies SettingsItem;

const BlockedUsers = () => {
  const { deleteAccount } = useSession();

  const {
    data,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    error,
  } = api.user.getBlockedUsers.useInfiniteQuery(
    {
      pageSize: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  // const settingsGroups = [
  //   {
  //     headerTitle: "Blocked Users (6)",
  //     items: [test, test, test, test, test, test],
  //   },
  // ] satisfies SettingsGroup[];

  const headerHeight = useHeaderHeight();

  return (
    <ScreenBaseView>
      {/* <YStack gap="$4">{settingsGroups.map(renderSettingsGroup)}</YStack> */}
      {data?.pages[0]?.items.length ? (
        <FlashList
          data={data.pages.flatMap((page) => page.items)}
          renderItem={({ item }) => <Text>{item}</Text>}
          onEndReached={fetchNextPage}
          estimatedItemSize={200}
        />
      ) : (
        <View flex={1} justifyContent="center" bottom={headerHeight}>
          <EmptyPlaceholder
            title="Blocked Users"
            subtitle="If you block someone, you'll be able to manage them here."
            icon={<UserRoundX />}
          />
          {/* <YStack alignItems="center" bottom={headerHeight} gap="$2">
            <UserRoundX size="$10" />
            <SizableText textAlign="center" size="$5" fontWeight="bold">
              Blocked Users
            </SizableText>
            <Paragraph textAlign="center" theme="alt2">
              If you block someone, you&apos;ll be able to manage them here.
            </Paragraph>
          </YStack> */}
        </View>
      )}
    </ScreenBaseView>
  );
};

export default BlockedUsers;
