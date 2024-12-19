import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { Send, UserRoundMinus, UserRoundPlus } from "@tamagui/lucide-icons";
import { getToken, H6, YStack } from "tamagui";

import { SearchInput } from "~/components/Inputs";
import {
  MediaListItem,
  MediaListItemActionProps,
  MediaListItemSkeleton,
  useActionSheetController,
} from "~/components/ui";
import { Spacer } from "~/components/ui/Spacer";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { useSession } from "~/contexts/SessionContext";
import useRouteProfile from "~/hooks/useRouteProfile";
import useSearch from "~/hooks/useSearch";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type FriendItem = RouterOutputs["friend"]["paginateFriendsOthers"]["items"][0];

const PAGE_SIZE = 20;

const Friends = () => {
  const utils = api.useUtils();
  const actionSheet = useActionSheetController();

  const { userId } = useLocalSearchParams<{ userId: string }>();

  const { user } = useSession();
  const { routeProfile } = useRouteProfile();

  const [refreshing, setRefreshing] = useState(false);

  const followMutation = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      await utils.friend.paginateFriendsOthers.cancel({
        userId,
        pageSize: PAGE_SIZE,
      });

      const prevData = utils.friend.paginateFriendsOthers.getInfiniteData({
        userId,
        pageSize: PAGE_SIZE,
      });
      if (prevData === undefined) return;

      utils.friend.paginateFriendsOthers.setInfiniteData(
        { userId, pageSize: PAGE_SIZE },
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
      utils.friend.paginateFriendsOthers.setInfiniteData(
        { userId, pageSize: PAGE_SIZE },
        ctx.prevData,
      );
    },
  });

  const unfollowMutation = api.follow.unfollowUser.useMutation({
    onMutate: async (newData) => {
      await utils.friend.paginateFriendsOthers.cancel({
        userId,
        pageSize: PAGE_SIZE,
      });

      const prevData = utils.friend.paginateFriendsOthers.getInfiniteData({
        userId,
        pageSize: PAGE_SIZE,
      });
      if (prevData === undefined) return;

      utils.friend.paginateFriendsOthers.setInfiniteData(
        { userId, pageSize: PAGE_SIZE },
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
      utils.friend.paginateFriendsOthers.setInfiniteData(
        { userId, pageSize: PAGE_SIZE },
        ctx.prevData,
      );
    },
  });

  const cancelFollowRequest = api.follow.cancelFollowRequest.useMutation({
    onMutate: async (newData) => {
      await utils.friend.paginateFriendsOthers.cancel({
        userId,
        pageSize: PAGE_SIZE,
      });

      const prevData = utils.friend.paginateFriendsOthers.getInfiniteData({
        userId,
        pageSize: PAGE_SIZE,
      });
      if (prevData === undefined) return;

      utils.friend.paginateFriendsOthers.setInfiniteData(
        { userId, pageSize: PAGE_SIZE },
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
      utils.friend.paginateFriendsOthers.setInfiniteData(
        { userId, pageSize: PAGE_SIZE },
        ctx.prevData,
      );
    },
  });

  const {
    data: friendsData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.friend.paginateFriendsOthers.useInfiniteQuery(
    { userId, pageSize: PAGE_SIZE },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const friendItems = useMemo(() => {
    return friendsData?.pages.flatMap((page) => page.items) ?? [];
  }, [friendsData]);

  const { searchQuery, setSearchQuery, filteredItems } = useSearch({
    data: friendItems,
    keys: ["name", "username"],
  });

  const handleOnEndReached = useCallback(async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const handleFollow = useCallback(
    async (userId: string) => {
      await followMutation.mutateAsync({ userId });
    },
    [followMutation],
  );

  const handleUnfollow = useCallback(
    async (userId: string) => {
      await unfollowMutation.mutateAsync({ userId });
    },
    [unfollowMutation],
  );

  const handleCancelFollowRequest = useCallback(
    async (userId: string) => {
      await cancelFollowRequest.mutateAsync({ recipientId: userId });
    },
    [cancelFollowRequest],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderActionButton = useCallback(
    (item: FriendItem): MediaListItemActionProps | undefined => {
      if (item.userId === user?.uid) return undefined;

      switch (item.relationshipState) {
        case "followRequestSent":
          return {
            label: "Sent",
            icon: Send,
            onPress: () =>
              actionSheet.show({
                title: "Cancel Follow Request",
                subtitle: `Are you sure you want to cancel your follow request to ${item.username}?`,
                imageUrl: item.profilePictureUrl ?? DefaultProfilePicture,
                buttonOptions: [
                  {
                    text: "Cancel Request",
                    textProps: { color: "$red11" },
                    onPress: () => void handleCancelFollowRequest(item.userId),
                  },
                ],
              }),
          };
        case "following":
          return {
            label: "Unfollow",
            icon: UserRoundMinus,
            onPress: () =>
              actionSheet.show({
                title: "Unfollow User",
                subtitle: `Are you sure you want to unfollow ${item.username}?`,
                imageUrl: item.profilePictureUrl ?? DefaultProfilePicture,
                buttonOptions: [
                  {
                    text: "Unfollow",
                    textProps: { color: "$red11" },
                    onPress: () => void handleUnfollow(item.userId),
                  },
                ],
              }),
          };
        case "notFollowing":
          return {
            label: "Follow",
            icon: UserRoundPlus,
            onPress: () => void handleFollow(item.userId),
          };
      }
    },
    [
      actionSheet,
      handleCancelFollowRequest,
      handleUnfollow,
      handleFollow,
      user?.uid,
    ],
  );

  const renderListItem = useCallback(
    (item: FriendItem) => (
      <MediaListItem
        title={item.username}
        subtitle={item.name}
        imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
        primaryAction={renderActionButton(item)}
        onPress={() =>
          routeProfile({ userId: item.userId, username: item.username })
        }
      />
    ),
    [renderActionButton, routeProfile],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <YStack gap="$4">
        <SearchInput
          placeholder="Search friends..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />
      </YStack>
    ),
    [searchQuery, setSearchQuery],
  );

  const ListEmptyComponent = useCallback(() => {
    if (isLoading) {
      return (
        <YStack gap="$4">
          {Array.from({ length: 10 }).map((_, index) => (
            <MediaListItemSkeleton key={index} />
          ))}
        </YStack>
      );
    }

    if (friendItems.length === 0) {
      return (
        <YStack flex={1} justifyContent="center">
          <EmptyPlaceholder
            title="No friends"
            subtitle="Once you follow someone, you'll see them here."
            icon={<UserRoundPlus />}
          />
        </YStack>
      );
    }

    if (filteredItems.length === 0) {
      return (
        <YStack flex={1}>
          <H6 theme="alt1">No Users Found</H6>
        </YStack>
      );
    }

    return null;
  }, [isLoading, friendItems.length, filteredItems.length]);

  return (
    <FlashList
      data={filteredItems}
      renderItem={({ item }) => renderListItem(item)}
      estimatedItemSize={75}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ItemSeparatorComponent={Spacer}
      ListHeaderComponentStyle={{ marginBottom: getToken("$4", "space") }}
      contentContainerStyle={{
        padding: getToken("$4", "space"),
      }}
      showsVerticalScrollIndicator={false}
      onEndReached={handleOnEndReached}
      onEndReachedThreshold={0.5}
      keyboardShouldPersistTaps="always"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    />
  );
};

export default Friends;
