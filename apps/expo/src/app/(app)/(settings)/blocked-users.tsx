import { useMemo, useState } from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { UserRoundX } from "@tamagui/lucide-icons";
import { Skeleton } from "moti/skeleton";
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
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type UserProfile = RouterOutputs["user"]["getBlockedUsers"]["items"][0];

const BlockedUsers = () => {
  const utils = api.useUtils();
  const headerHeight = useHeaderHeight();

  const placeholderData = useMemo(() => {
    return Array.from({ length: 10 }, () => null);
  }, []);

  const unblockUser = api.user.unblockUser.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.user.getBlockedUsers.cancel();

      // Get the data from the queryCache
      const prevData = utils.user.getBlockedUsers.getInfiniteData();
      if (prevData === undefined) return;

      // prevData// Optimistically update the data
      utils.user.getBlockedUsers.setInfiniteData(
        {},
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.filter(
              (item) => item.userId !== newData.blockedUserId,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      utils.user.getBlockedUsers.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.user.getBlockedUsers.invalidate();
    },
  });

  const {
    data: blockedUsersData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = api.user.getBlockedUsers.useInfiniteQuery(
    {
      pageSize: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const handleUnblock = async (blockedUserId: string) => {
    await unblockUser.mutateAsync({
      blockedUserId,
    });
  };

  const itemCount = useMemo(() => {
    if (blockedUsersData === undefined) return 0;
    return blockedUsersData.pages.reduce(
      (total, page) => total + page.items.length,
      0,
    );
  }, [blockedUsersData]);

  const blockedUsersItems = useMemo(() => {
    return blockedUsersData?.pages.flatMap((page) => page.items);
  }, [blockedUsersData]);

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  return (
    <ScreenBaseView>
      {isLoading || itemCount ? (
        <YStack flex={1} gap="$2">
          <FlashList
            data={isLoading ? placeholderData : blockedUsersItems}
            estimatedItemSize={75}
            onEndReached={handleOnEndReached}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <SizableText size="$2" theme="alt1" marginBottom="$2">
                BLOCKED USERS
              </SizableText>
            }
            renderItem={({ item, index }) => {
              const isFirstInGroup = index === 0;
              const isLastInGroup = index === itemCount - 1;

              return (
                <View>
                  {item === null ? (
                    <BlockedUserListItem
                      loading
                      isFirstInGroup={isFirstInGroup}
                      isLastInGroup={isLastInGroup}
                    />
                  ) : (
                    <BlockedUserListItem
                      item={item}
                      loading={false}
                      onUnblock={handleUnblock}
                      isFirstInGroup={isFirstInGroup}
                      isLastInGroup={isLastInGroup}
                    />
                  )}
                </View>
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

interface BaseProps {
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

interface LoadingProps extends BaseProps {
  loading: true;
}

interface LoadedProps extends BaseProps {
  loading: false;
  item: UserProfile;
  onUnblock: (blockedUserId: string) => void;
}

type BlockedUserListItemProps = LoadingProps | LoadedProps;

const BlockedUserListItem = (props: BlockedUserListItemProps) => {
  const [actionDialogVisible, setActionDialogVisible] = useState(false);

  return (
    <Skeleton.Group show={props.loading}>
      <ListItem
        size="$4.5"
        hoverTheme={false}
        pressTheme={false}
        padding={12}
        borderColor="$gray4"
        borderWidth={1}
        borderBottomWidth={0}
        {...(props.isFirstInGroup && {
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        })}
        {...(props.isLastInGroup && {
          borderBottomWidth: 1,
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
        })}
      >
        <XStack flex={1} alignItems="center">
          <XStack flex={1} alignItems="center" gap="$2">
            <Skeleton radius={100}>
              <Avatar circular size="$5">
                <Avatar.Image
                  src={props.loading ? undefined : props.item.profilePictureUrl}
                />
              </Avatar>
            </Skeleton>

            <YStack>
              <Skeleton width={100}>
                <SizableText size="$3" theme="alt1">
                  {props.loading ? "" : props.item.name}
                </SizableText>
              </Skeleton>
              <Skeleton width={100}>
                <SizableText size="$3" theme="alt1">
                  {props.loading ? "" : props.item.username}
                </SizableText>
              </Skeleton>
            </YStack>
          </XStack>
          <AlertDialog
            title={`Unblock ${props.loading ? "" : props.item.name}`}
            description={`Are you sure you want to unblock ${props.loading ? "" : props.item.name}?`}
            trigger={
              <Skeleton>
                <Button
                  size="$3"
                  icon={<UserRoundX size="$1" />}
                  {...(!props.loading && {
                    onPress: () => setActionDialogVisible(true),
                  })}
                >
                  Unblock
                </Button>
              </Skeleton>
            }
            {...(!props.loading && {
              onAccept: () => {
                props.onUnblock(props.item.userId);
                setActionDialogVisible(false);
              },
            })}
            onCancel={() => setActionDialogVisible(false)}
            isVisible={actionDialogVisible}
          />
        </XStack>
      </ListItem>
    </Skeleton.Group>
  );
};

export default BlockedUsers;
