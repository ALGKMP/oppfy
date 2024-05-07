import { useEffect, useMemo, useState } from "react";
import * as FileSystem from "expo-file-system";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import {
  ChevronRight,
  MessageCircle,
  UserRoundX,
  XCircle,
} from "@tamagui/lucide-icons";
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
import {
  Avatar,
  Button,
  ListItem,
  Paragraph,
  SizableText,
  Text,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";

import {
  renderSettingsGroup,
  SettingsGroup,
  SettingsItem,
} from "~/components/Settings";
import type { ButtonOption } from "~/components/Sheets";
import { ActionSheet } from "~/components/Sheets";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { ScreenBaseView } from "~/components/Views";
import { useSession } from "~/contexts/SessionContext";
import { api } from "~/utils/api";

const BlockedUsers = () => {
  const headerHeight = useHeaderHeight();

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
      pageSize: 2,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const totalCount = useMemo(() => {
    if (data === undefined) return 0;
    return data.pages.reduce((total, page) => total + page.items.length, 0);
  }, [data]);

  return (
    <ScreenBaseView>
      {/* <YStack gap="$4">{settingsGroups.map(renderSettingsGroup)}</YStack> */}
      {data?.pages[0]?.items.length ? (
        <FlashList
          data={data.pages.flatMap((page) => page.items)}
          estimatedItemSize={75}
          onEndReached={fetchNextPage}
          renderItem={({ item, index }) => {
            const isFirstInGroup = index === 0;
            const isLastInGroup = index === totalCount - 1;

            return (
              <ListItem
                size="$4.5"
                hoverTheme={false}
                pressTheme={false}
                padding={12}
                borderColor="$gray4"
                borderWidth={1}
                borderBottomWidth={0}
                {...(isFirstInGroup && {
                  borderTopLeftRadius: 10,
                  borderTopRightRadius: 10,
                })}
                {...(isLastInGroup && {
                  borderBottomWidth: 1,
                  borderBottomLeftRadius: 10,
                  borderBottomRightRadius: 10,
                })}
              >
                <XStack flex={1} alignItems="center">
                  <XStack flex={1} alignItems="center" gap="$2">
                    <YStack>
                      <SizableText size="$5">{item.name}</SizableText>
                      <SizableText size="$3" theme="alt1">
                        {item.username}
                      </SizableText>
                    </YStack>
                  </XStack>
                </XStack>
              </ListItem>
            );
          }}
        />
      ) : (
        <View flex={1} justifyContent="center" bottom={headerHeight}>
          <EmptyPlaceholder
            title="Blocked Users"
            subtitle="If you block someone, you'll be able to manage them here."
            icon={<UserRoundX />}
          />
        </View>
      )}
    </ScreenBaseView>
  );
};

export default BlockedUsers;
