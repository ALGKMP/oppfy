import { useEffect, useMemo } from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { UserRoundX } from "@tamagui/lucide-icons";
import {
  Avatar,
  Button,
  ListItem,
  SizableText,
  View,
  XStack,
  YStack,
} from "tamagui";

import { AlertDialog } from "~/components/Dialogs";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { ScreenBaseView } from "~/components/Views";
import { useSession } from "~/contexts/SessionContext";
import { api } from "~/utils/api";

const BlockedUsers = () => {
  const headerHeight = useHeaderHeight();

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    api.user.getBlockedUsers.useInfiniteQuery(
      {
        pageSize: 10,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const itemCount = useMemo(() => {
    if (data === undefined) return 0;
    return data.pages.reduce((total, page) => total + page.items.length, 0);
  }, [data]);

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  return (
    <ScreenBaseView>
      {data?.pages[0]?.items.length ? (
        <YStack flex={1} gap="$2">
          <FlashList
            data={data.pages.flatMap((page) => page.items)}
            ListHeaderComponent={
              <SizableText size="$2" theme="alt1" marginBottom="$2">
                BLOCKED USERS
              </SizableText>
            }
            estimatedItemSize={75}
            onEndReached={handleOnEndReached}
            renderItem={({ item, index }) => {
              const isFirstInGroup = index === 0;
              const isLastInGroup = index === itemCount - 1;

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
                      <Avatar circular size="$5">
                      {item.profilePictureUrl && (
                        <Avatar.Image
                          accessibilityLabel="Cam"
                          {...(item.profilePictureUrl && {
                            src: item.profilePictureUrl,
                          })}
                        />
                      </Avatar>

                      <YStack>
                        <SizableText size="$5">{item.name}</SizableText>
                        <SizableText size="$3" theme="alt1">
                          {item.username}
                        </SizableText>
                      </YStack>
                    </XStack>
                    <AlertDialog
                      title={`Unblock ${item.name}`}
                      description={`Are you sure you want to unblock ${item.name}?`}
                      trigger={
                        <Button size="$3" icon={<UserRoundX size="$1" />}>
                          Unblock
                        </Button>
                      }
                    />
                  </XStack>
                </ListItem>
              );
            }}
          />
        </YStack>
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
