import React, { useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { UserRoundPlus } from "@tamagui/lucide-icons";
import { H5, H6, SizableText, View, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { SearchInput } from "~/components/Inputs";
import { VirtualizedListItem } from "~/components/ListItems";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { ListItem } from "~/features/connections/components";
import { useFollowHandlers } from "~/features/connections/hooks";
import useSearch from "~/hooks/useSearch";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const FollowingList = () => {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [refreshing, setRefreshing] = useState(false);

  const { follow, unfollow, cancelFollowRequest } = useFollowHandlers({
    userId: userId ?? "",
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
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.follow.paginateFollowingOthers.useInfiniteQuery(
    { userId: userId ?? "", pageSize: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const followingItems = useMemo(
    () => followingData?.pages.flatMap((page) => page.items) ?? [],
    [followingData],
  );

  const { searchQuery, setSearchQuery, filteredItems } = useSearch({
    data: followingItems,
    keys: ["name", "username"],
  });

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
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

  const renderFollowing = () => (
    <CardContainer>
      <H5 theme="alt1">Following</H5>
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
        title="Following"
        subtitle="Once you follow someone, you'll see them here."
        icon={<UserRoundPlus />}
      />
    </View>
  );

  if (isLoading) {
    return (
      <BaseScreenView scrollable>{renderLoadingSkeletons()}</BaseScreenView>
    );
  }

  if (followingItems.length === 0) {
    return <BaseScreenView>{renderNoResults()}</BaseScreenView>;
  }

  return (
    <BaseScreenView
      scrollable
      keyboardDismissMode="interactive"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <YStack gap="$4">
        <SearchInput
          placeholder="Search following..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />

        {filteredItems.length > 0 ? (
          renderFollowing()
        ) : (
          <H6 theme="alt1" lineHeight={0}>
            No Users Found
          </H6>
        )}
      </YStack>
    </BaseScreenView>
  );
};

export default FollowingList;
