import React, { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { UserRoundPlus } from "@tamagui/lucide-icons";
import { Separator, View } from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import {
  ListHeader,
  ListItem,
  useFollowHandlers,
} from "~/features/connections";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const FollowingList = () => {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const headerHeight = useHeaderHeight();

  const { follow, unfollow, cancelFollowRequest } = useFollowHandlers({
    userId,
    queryToOptimisticallyUpdate: "follow.paginateFollowingOthers",
    queriesToInvalidate: [
      "follow.paginateFollowingOthers",
      "follow.paginateFollowersOthers",
      "friend.paginateFriendsOthers",
    ],
  });

  const {
    data: followingData,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.follow.paginateFollowingOthers.useInfiniteQuery(
    { userId, pageSize: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const followingItems = useMemo(
    () => followingData?.pages.flatMap((page) => page.items) ?? [],
    [followingData],
  );
  const itemCount = useMemo(
    () =>
      followingData?.pages.reduce(
        (total, page) => total + page.items.length,
        0,
      ) ?? 0,
    [followingData],
  );

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  if (isLoading) {
    return (
      <BaseScreenView paddingBottom={0}>
        <FlashList
          data={PLACEHOLDER_DATA}
          ItemSeparatorComponent={Separator}
          estimatedItemSize={75}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<ListHeader title="FOLLOWERS" />}
          renderItem={() => (
            <VirtualizedListItem
              loading
              showSkeletons={{
                imageUrl: true,
                title: true,
                subtitle: true,
                button: true,
              }}
            />
          )}
        />
      </BaseScreenView>
    );
  }

  if (itemCount === 0) {
    return (
      <BaseScreenView>
        <View flex={1} justifyContent="center" bottom={headerHeight}>
          <EmptyPlaceholder
            title="Following"
            subtitle="Once you follow someone, you'll see them here."
            icon={<UserRoundPlus />}
          />
        </View>
      </BaseScreenView>
    );
  }

  return (
    <BaseScreenView paddingBottom={0}>
      <FlashList
        onRefresh={refetch}
        refreshing={isRefetching}
        data={followingItems}
        ItemSeparatorComponent={Separator}
        estimatedItemSize={75}
        onEndReached={handleOnEndReached}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<ListHeader title="FOLLOWERS" />}
        renderItem={({ item }) => (
          <ListItem
            item={item}
            handleFollow={follow}
            handleUnfollow={unfollow}
            handleCancelFollowRequest={cancelFollowRequest}
          />
        )}
      />
    </BaseScreenView>
  );
};

export default FollowingList;
