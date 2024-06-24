import React, { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { UserRoundPlus } from "@tamagui/lucide-icons";
import { ListItemTitle, Separator, View } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { VirtualizedListItem } from "~/components/ListItems";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";
import { ListItem } from "../components";
import { useFollowHandlers } from "../hooks";

const FollowerList = () => {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const headerHeight = useHeaderHeight();

  const { follow, unfollow, cancelFollowRequest } = useFollowHandlers({
    userId,
    queryToOptimisticallyUpdate: "follow.paginateFollowersOthers",
    queriesToInvalidate: [
      "follow.paginateFollowingOthers",
      "follow.paginateFollowersOthers",
      "friend.paginateFriendsOthers",
    ],
  });

  const {
    data: followersData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.follow.paginateFollowersOthers.useInfiniteQuery(
    { userId, pageSize: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const followerItems = useMemo(
    () => followersData?.pages.flatMap((page) => page.items) ?? [],
    [followersData],
  );
  const itemCount = useMemo(
    () =>
      followersData?.pages.reduce(
        (total, page) => total + page.items.length,
        0,
      ) ?? 0,
    [followersData],
  );

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  if (isLoading) {
    return (
      <BaseScreenView scrollable>
        <CardContainer>
          {PLACEHOLDER_DATA.map((_, index) => (
            <VirtualizedListItem
              key={index}
              loading
              showSkeletons={{
                imageUrl: true,
                title: true,
                subtitle: true,
                button: true,
              }}
            />
          ))}
        </CardContainer>
      </BaseScreenView>
    );
  }

  if (itemCount === 0) {
    return (
      <BaseScreenView>
        <View flex={1} justifyContent="center" bottom={headerHeight}>
          <EmptyPlaceholder
            title="Followers"
            subtitle="Once you follow someone, you'll see them here."
            icon={<UserRoundPlus />}
          />
        </View>
      </BaseScreenView>
    );
  }

  return (
    <BaseScreenView scrollable>
      <CardContainer>
        <FlashList
          data={followerItems}
          onRefresh={refetch}
          refreshing={isLoading}
          estimatedItemSize={75}
          onEndReached={handleOnEndReached}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ListItem
              item={item}
              handleFollow={follow}
              handleUnfollow={unfollow}
              handleCancelFollowRequest={cancelFollowRequest}
            />
          )}
        />
      </CardContainer>
    </BaseScreenView>
  );
};

export default FollowerList;
