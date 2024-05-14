import React, { useMemo } from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { UserRoundMinus, UserRoundPlus } from "@tamagui/lucide-icons";
import { Button, Separator, SizableText, View } from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import { ActionSheet } from "~/components/Sheets";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const Friends = () => {
  const headerHeight = useHeaderHeight();

  const utils = api.useUtils();

  const removeFriend = api.user.removeFriend.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.user.getCurrentUserFriends.cancel();

      // Get the data from the queryCache
      const prevData = utils.user.getCurrentUserFollowers.getInfiniteData();
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.user.getCurrentUserFriends.setInfiniteData(
        {},
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.filter(
              (item) => item.userId !== newData.recipientId,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      utils.user.getCurrentUserFriends.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.user.getCurrentUserFriends.invalidate();
    },
  });

  const {
    data: friendsData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = api.user.getCurrentUserFriends.useInfiniteQuery(
    {
      pageSize: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const placeholderData = useMemo(() => {
    return Array.from({ length: 20 }, () => null);
  }, []);

  const friendsItems = useMemo(() => {
    return friendsData?.pages.flatMap((page) => page.items);
  }, [friendsData]);

  const itemCount = useMemo(() => {
    if (friendsData === undefined) return 0;

    return friendsData.pages.reduce(
      (total, page) => total + page.items.length,
      0,
    );
  }, [friendsData]);

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  return (
    <BaseScreenView paddingBottom={0}>
      {isLoading || itemCount ? (
        <FlashList
          data={isLoading ? placeholderData : friendsItems}
          ItemSeparatorComponent={Separator}
          estimatedItemSize={75}
          onEndReached={handleOnEndReached}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <SizableText size="$2" theme="alt1" marginBottom="$2">
              FRIENDS
            </SizableText>
          }
          renderItem={({ item }) => {
            return (
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
                    title={item.username}
                    subtitle={item.name}
                    imageUrl={item.profilePictureUrl}
                    button={
                      <ActionSheet
                        title="Remove Friend"
                        subtitle={`Are you sure you want to remove ${item.username} from your friends?`}
                        imageUrl={item.profilePictureUrl}
                        trigger={
                          <Button size="$3" icon={<UserRoundMinus size="$1" />}>
                            Remove
                          </Button>
                        }
                        buttonOptions={[
                          {
                            text: "Unfriend",
                            textProps: { color: "$red9" },
                            onPress: () =>
                              removeFriend.mutate({
                                recipientId: item.userId,
                              }),
                          },
                        ]}
                      />
                    }
                  />
                )}
              </View>
            );
          }}
        />
      ) : (
        <View flex={1} justifyContent="center" bottom={headerHeight}>
          <EmptyPlaceholder
            title="Friends"
            subtitle="Once you friend someone, you'll see them here."
            icon={<UserRoundPlus />}
          />
        </View>
      )}
    </BaseScreenView>
  );
};

export default Friends;
