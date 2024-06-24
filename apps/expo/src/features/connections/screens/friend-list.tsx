import React, { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
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

const FriendList = () => {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const headerHeight = useHeaderHeight();

  const { follow, unfollow, cancelFollowRequest } = useFollowHandlers({
    userId,
    queryToOptimisticallyUpdate: "friend.paginateFriendsOthers",
    queriesToInvalidate: [
      "follow.paginateFollowingOthers",
      "follow.paginateFollowersOthers",
      "friend.paginateFriendsOthers",
    ],
  });

  const {
    data: friendData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.friend.paginateFriendsOthers.useInfiniteQuery(
    { userId, pageSize: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const friendItems = useMemo(
    () => friendData?.pages.flatMap((page) => page.items) ?? [],
    [friendData],
  );

  const { searchQuery, setSearchQuery, filteredItems } = useSearch({
    data: friendItems,
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
    <View flex={1} justifyContent="center" bottom={headerHeight}>
      <EmptyPlaceholder
        title="Friends"
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

  if (friendItems.length === 0) {
    return <BaseScreenView>{renderNoResults()}</BaseScreenView>;
  }

  return (
    <BaseScreenView scrollable>
      <YStack gap="$4">
        <Input
          placeholder="Search friends..."
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

export default FriendList;
