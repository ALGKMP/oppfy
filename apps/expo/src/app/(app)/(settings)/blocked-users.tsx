import { useMemo } from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { UserRoundX } from "@tamagui/lucide-icons";
import { Button, Separator, SizableText, View } from "tamagui";

import { AlertDialog } from "~/components/Dialogs";
import { VirtualizedListItem } from "~/components/ListItems";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const BlockedUsers = () => {
  const utils = api.useUtils();
  const headerHeight = useHeaderHeight();

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
      pageSize: 20,
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage.nextCursor;
      },
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

  const placeholderData = useMemo(() => {
    return Array.from({ length: 20 }, () => null);
  }, []);

  const blockedUsersItems = useMemo(() => {
    return blockedUsersData?.pages.flatMap((page) => page.items);
  }, [blockedUsersData]);

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      console.log("Fetching next page");
      await fetchNextPage();
    }
  };

  return (
    <BaseScreenView paddingBottom={0}>
      {isLoading || itemCount ? (
        <>
          <FlashList
            data={isLoading ? placeholderData : blockedUsersItems}
            ItemSeparatorComponent={Separator}
            estimatedItemSize={75}
            onEndReached={handleOnEndReached}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <SizableText size="$2" theme="alt1" marginBottom="$2">
                BLOCKED USERS
              </SizableText>
            }
            renderItem={({ item }) => (
              <View>
                {item === null ? (
                  <VirtualizedListItem
                    loading
                    showSkeletons={{
                      imageUrl: true,
                      title: true,
                      subtitle: true,
                      button: true,
                    }}
                  />
                ) : (
                  <VirtualizedListItem
                    loading={false}
                    imageUrl={item.profilePictureUrl}
                    title={item.username}
                    subtitle={item.name}
                    button={
                      <AlertDialog
                        title={`Unblock ${item.name}`}
                        description={`Are you sure you want to unblock ${item.name}?`}
                        trigger={
                          <Button size="$3" icon={<UserRoundX size="$1" />}>
                            Unblock
                          </Button>
                        }
                        onAccept={() => handleUnblock(item.userId)}
                      />
                    }
                  />
                )}
              </View>
            )}
          />
        </>
      ) : (
        <View flex={1} justifyContent="center" bottom={headerHeight}>
          <EmptyPlaceholder
            title="Blocked Users"
            subtitle="If you block someone, you'll be able to manage them here."
            icon={<UserRoundX />}
          />
        </View>
      )}
    </BaseScreenView>
  );
};

export default BlockedUsers;
