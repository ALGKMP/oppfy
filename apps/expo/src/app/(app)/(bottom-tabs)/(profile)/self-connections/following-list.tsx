import React, { useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.png";
import { FlashList } from "@shopify/flash-list";
import { Send, UserRoundMinus, UserRoundPlus } from "@tamagui/lucide-icons";
import { Input, SizableText, View, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { SearchInput } from "~/components/Inputs";
import { VirtualizedListItem } from "~/components/ListItems";
import type { ButtonProps } from "~/components/ListItems/VirtualizedListItem";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import useSearch from "~/hooks/useSearch";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

type FollowingItem =
  RouterOutputs["follow"]["paginateFollowingSelf"]["items"][0];

const FollowingList = () => {
  const router = useRouter();
  const utils = api.useUtils();

  const [refreshing, setRefreshing] = useState(false);

  const followMutation = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.follow.paginateFollowingSelf.cancel();

      // Get the data from the queryCache
      const prevData = utils.follow.paginateFollowingSelf.getInfiniteData({
        pageSize: 20,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.follow.paginateFollowingSelf.setInfiniteData(
        { pageSize: 20 },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.userId === newData.userId
                ? {
                    ...item,
                    relationshipState:
                      item.privacy === "private"
                        ? "followRequestSent"
                        : "following",
                  }
                : item,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      utils.follow.paginateFollowingSelf.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      // await utils.follow.paginateFollowingSelf.invalidate();
    },
  });

  const unfollowMutation = api.follow.unfollowUser.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.follow.paginateFollowingSelf.cancel();

      // Get the data from the queryCache
      const prevData = utils.follow.paginateFollowingSelf.getInfiniteData({
        pageSize: 20,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.follow.paginateFollowingSelf.setInfiniteData(
        { pageSize: 20 },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.userId === newData.userId
                ? { ...item, relationshipState: "notFollowing" }
                : item,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      utils.follow.paginateFollowingSelf.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      // await utils.follow.paginateFollowingSelf.invalidate();
    },
  });

  const cancelFollowRequest = api.request.cancelFollowRequest.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.follow.paginateFollowingSelf.cancel();

      // Get the data from the queryCache
      const prevData = utils.follow.paginateFollowingSelf.getInfiniteData({
        pageSize: 20,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.follow.paginateFollowingSelf.setInfiniteData(
        { pageSize: 20 },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.userId === newData.recipientId
                ? { ...item, relationshipState: "notFollowing" }
                : item,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      utils.follow.paginateFollowingSelf.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      // await utils.follow.paginateFollowingSelf.invalidate();
    },
  });

  const {
    data: followingData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.follow.paginateFollowingSelf.useInfiniteQuery(
    {
      pageSize: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const followingItems = useMemo(() => {
    return followingData?.pages.flatMap((page) => page.items) ?? [];
  }, [followingData]);

  const { searchQuery, setSearchQuery, filteredItems } = useSearch({
    data: followingItems,
    keys: ["name", "username"],
  });

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const handleFollow = async (userId: string) =>
    await followMutation.mutateAsync({ userId });

  const handleUnfollow = async (userId: string) =>
    await unfollowMutation.mutateAsync({ userId });

  const handleCancelFollowRequest = async (senderId: string) =>
    await cancelFollowRequest.mutateAsync({ recipientId: senderId });

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

  const renderButton = (item: FollowingItem): ButtonProps => {
    switch (item.relationshipState) {
      case "followRequestSent":
        return {
          text: "Sent",
          icon: Send,
          onPress: () => void handleCancelFollowRequest(item.userId),
        };
      case "following":
        return {
          text: "Unfollow",
          icon: UserRoundMinus,
          onPress: () => void handleUnfollow(item.userId),
        };
      case "notFollowing":
        return {
          text: "Follow",
          icon: UserRoundPlus,
          theme: "blue",
          onPress: () => void handleFollow(item.userId),
        };
    }
  };

  const renderListItem = (item: FollowingItem) => (
    <VirtualizedListItem
      loading={false}
      title={item.username}
      subtitle={item.name}
      imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
      button={renderButton(item)}
      onPress={() =>
        router.push({
          pathname: "/(profile)/profile/[userId]",
          params: { userId: item.userId, username: item.username },
        })
      }
    />
  );

  const renderFollowing = () => (
    <CardContainer>
      <FlashList
        data={filteredItems}
        onRefresh={refetch}
        refreshing={isLoading}
        estimatedItemSize={75}
        onEndReached={handleOnEndReached}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => renderListItem(item)}
      />
    </CardContainer>
  );

  const renderNoResults = () => (
    <View flex={1} justifyContent="center">
      <EmptyPlaceholder
        title="No results"
        subtitle="No following found."
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
          <SizableText lineHeight={0}>No Users Found</SizableText>
        )}
      </YStack>
    </BaseScreenView>
  );
};

export default FollowingList;
