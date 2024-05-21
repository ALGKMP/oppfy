import { useMemo } from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { UserRoundX } from "@tamagui/lucide-icons";
import { Button, Separator, SizableText, View } from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import { ActionSheet } from "~/components/Sheets";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const BlockedUsers = () => {
  const utils = api.useUtils();
  const headerHeight = useHeaderHeight();

  const unblockUser = api.block.unblockUser.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.block.paginateBlockedUsers.cancel();

      // Get the data from the queryCache
      const prevData = utils.block.paginateBlockedUsers.getInfiniteData();
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.block.paginateBlockedUsers.setInfiniteData(
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
      utils.block.paginateBlockedUsers.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.block.paginateBlockedUsers.invalidate();
    },
  });

  const {
    data: blockedUsersData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = api.block.paginateBlockedUsers.useInfiniteQuery(
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
    <BaseScreenView paddingBottom={0} scrollable>
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
                      <ActionSheet
                        title={`Unblock ${item.username}`}
                        subtitle={`Are you sure you want to unblock ${item.username}?`}
                        imageUrl={item.profilePictureUrl}
                        trigger={
                          <Button size="$3" icon={<UserRoundX size="$1" />}>
                            Unblock
                          </Button>
                        }
                        buttonOptions={[
                          {
                            text: "Unblock",
                            textProps: { color: "$red9" },
                            onPress: () => void handleUnblock(item.userId),
                          },
                        ]}
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
