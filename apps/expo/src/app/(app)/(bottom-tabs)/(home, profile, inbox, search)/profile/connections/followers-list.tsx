import React, { useState } from "react";
import { RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { UserRoundPlus } from "@tamagui/lucide-icons";
import { H5, H6, View, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { SearchInput } from "~/components/Inputs";
import { VirtualizedListItem } from "~/components/ListItems";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { useSession } from "~/contexts/SessionContext";
import { ListItem } from "~/features/connections/components";
import { useFollowHandlers } from "~/features/connections/hooks";
import useSearch from "~/hooks/useSearch";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const FollowersList = () => {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const { user } = useSession();

  const [refreshing, setRefreshing] = useState(false);

  const { follow, unfollow, cancelFollowRequest } = useFollowHandlers({
    userId: userId,
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
    { userId: userId, pageSize: 20 },
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

  const renderFriends = () => (
    <CardContainer>
      <H5 theme="alt1">Followers</H5>
      <FlashList
        data={filteredItems}
        onRefresh={refetch}
        refreshing={isLoading}
        keyExtractor={(item) => "followers_list_" + item.userId}
        estimatedItemSize={75}
        onEndReached={handleOnEndReached}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ListItem
            item={item}
            handleFollow={follow}
            handleUnfollow={unfollow}
            handleCancelFollowRequest={cancelFollowRequest}
            hideButton={item.userId === user?.uid}
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
    return (
      <BaseScreenView
        scrollable
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderNoResults()}
      </BaseScreenView>
    );
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
          placeholder="Search followers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />

        {filteredItems.length > 0 ? (
          renderFriends()
        ) : (
          <H6 theme="alt1" lineHeight={0}>
            No Users Found
          </H6>
        )}
      </YStack>
    </BaseScreenView>
  );
};

export default FollowersList;
