import React, { useMemo, useState } from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { UserRoundMinus, UserRoundX } from "@tamagui/lucide-icons";
import { Button, Separator, SizableText, View } from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import { ActionSheet } from "~/components/Sheets";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const Followers = () => {
  const headerHeight = useHeaderHeight();

  const utils = api.useUtils();

  const removeFollower = api.user.removeFollower.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.user.getCurrentUserFollowers.cancel();

      // Get the data from the queryCache
      const prevData = utils.user.getCurrentUserFollowers.getInfiniteData();
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.user.getCurrentUserFollowers.setInfiniteData(
        {},
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.userId !== newData.userId),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      utils.user.getCurrentUserFollowers.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.user.getCurrentUserFollowers.invalidate();
    },
  });

  const {
    data: followersData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = api.user.getCurrentUserFollowers.useInfiniteQuery(
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
    return followersData?.pages.flatMap((page) => page.items);
  }, [followersData]);

  const itemCount = useMemo(() => {
    if (followersData === undefined) return 0;

    return followersData.pages.reduce(
      (total, page) => total + page.items.length,
      0,
    );
  }, [followersData]);

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
              FOLLOWERS
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
                        title={`Remove ${item.username}`}
                        subtitle={`Are you sure you want to remove ${item.username} from your followers?`}
                        imageUrl={item.profilePictureUrl}
                        trigger={
                          <Button size="$3" icon={<UserRoundMinus size="$1" />}>
                            Remove
                          </Button>
                        }
                        buttonOptions={[
                          {
                            text: "Unblock",
                            textProps: { color: "$red9" },
                            onPress: () =>
                              removeFollower.mutate({
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
            title="Followers"
            subtitle="You'll see all the people who follow you here."
            icon={<UserRoundX />}
          />
        </View>
      )}
    </BaseScreenView>
  );
};

export default Followers;
