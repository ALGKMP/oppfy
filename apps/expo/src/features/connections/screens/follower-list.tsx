import React from "react";
import { useLocalSearchParams } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { UserRoundPlus } from "@tamagui/lucide-icons";
import { Input, SizableText, View, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { VirtualizedListItem } from "~/components/ListItems";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import useSearch from "~/hooks/useSearch";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";
import { ListItem } from "../components";
import { useFollowHandlers } from "../hooks";

const FollowerList = () => {
  const { userId } = useLocalSearchParams<{ userId: string }>();

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

  const followerItems =
    followersData?.pages.flatMap((page) => page.items) ?? [];

  const { searchQuery, setSearchQuery, filteredItems } = useSearch({
    data: followerItems,
    keys: ["name", "username"],
  });

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const renderLoadingSkeletons = () => (
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
  );

  const renderFriends = () => (
    <CardContainer>
      <FlashList
        data={filteredItems}
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
  );

  const renderNoResults = () => (
    <View flex={1} justifyContent="center">
      <EmptyPlaceholder
        title="No results"
        subtitle="No followers found."
        icon={<UserRoundPlus />}
      />
    </View>
  );

  if (isLoading) {
    return (
      <BaseScreenView scrollable>{renderLoadingSkeletons()}</BaseScreenView>
    );
  }

  if (followerItems.length === 0) {
    return <BaseScreenView>{renderNoResults()}</BaseScreenView>;
  }

  return (
    <BaseScreenView scrollable>
      <YStack gap="$4">
        <Input
          placeholder="Search followers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {filteredItems.length > 0 ? (
          renderFriends()
        ) : (
          <SizableText lineHeight={0}>No Users Found</SizableText>
        )}
      </YStack>
    </BaseScreenView>
  );
};

export default FollowerList;
