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

type FollowingItem =
  RouterOutputs["follow"]["paginateFollowingOthers"]["items"][0];

const PAGE_SIZE = 20;

const Following = () => {
  const utils = api.useUtils();
  const actionSheet = useActionSheetController();

  const { userId } = useLocalSearchParams<{ userId: string }>();

  const { user } = useSession();
  const { routeProfile } = useRouteProfile();

  const [refreshing, setRefreshing] = useState(false);

  const followMutation = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      await utils.follow.paginateFollowingOthers.cancel({
        userId,
        pageSize: PAGE_SIZE,
      });

      const prevData = utils.follow.paginateFollowingOthers.getInfiniteData({
        userId,
        pageSize: PAGE_SIZE,
      });
      if (prevData === undefined) return;

      utils.follow.paginateFollowingOthers.setInfiniteData(
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
      utils.follow.paginateFollowingOthers.setInfiniteData(
        { userId, pageSize: PAGE_SIZE },
        ctx.prevData,
      );
    },
  });

  const unfollowMutation = api.follow.unfollowUser.useMutation({
    onMutate: async (newData) => {
      await utils.follow.paginateFollowingOthers.cancel({
        userId,
        pageSize: PAGE_SIZE,
      });

      const prevData = utils.follow.paginateFollowingOthers.getInfiniteData({
        userId,
        pageSize: PAGE_SIZE,
      });
      if (prevData === undefined) return;

      utils.follow.paginateFollowingOthers.setInfiniteData(
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
      utils.follow.paginateFollowingOthers.setInfiniteData(
        { userId, pageSize: PAGE_SIZE },
        ctx.prevData,
      );
    },
  });

  const cancelFollowRequest = api.follow.cancelFollowRequest.useMutation({
    onMutate: async (newData) => {
      await utils.follow.paginateFollowingOthers.cancel({
        userId,
        pageSize: PAGE_SIZE,
      });

      const prevData = utils.follow.paginateFollowingOthers.getInfiniteData({
        userId,
        pageSize: PAGE_SIZE,
      });
      if (prevData === undefined) return;

      utils.follow.paginateFollowingOthers.setInfiniteData(
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
      utils.follow.paginateFollowingOthers.setInfiniteData(
        { userId, pageSize: PAGE_SIZE },
        ctx.prevData,
      );
    },
  });

  const {
    data: followingData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.follow.paginateFollowingOthers.useInfiniteQuery(
    { userId, pageSize: PAGE_SIZE },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const followingItems = useMemo(() => {
    return followingData?.pages.flatMap((page) => page.items) ?? [];
  }, [followingData]);

  const { searchQuery, setSearchQuery, filteredItems } = useSearch({
    data: followingItems,
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
    (item: FollowingItem): MediaListItemActionProps | undefined => {
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

  return (
    <FlashList
      data={filteredItems}
      renderItem={({ item }) => (
        <MediaListItem
          title={item.username}
          subtitle={item.name}
          imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
          primaryAction={renderActionButton(item)}
          onPress={() =>
            routeProfile({ userId: item.userId, username: item.username })
          }
        />
      )}
      estimatedItemSize={75}
      ListHeaderComponent={
        <YStack gap="$4">
          <SearchInput
            placeholder="Search following..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery("")}
          />
        </YStack>
      }
      ListEmptyComponent={
        isLoading ? (
          <YStack gap="$4">
            {Array.from({ length: 10 }).map((_, index) => (
              <MediaListItemSkeleton key={index} />
            ))}
          </YStack>
        ) : followingItems.length === 0 ? (
          <YStack flex={1} justifyContent="center">
            <EmptyPlaceholder
              title="No following"
              subtitle="No following found."
              icon={<UserRoundPlus />}
            />
          </YStack>
        ) : filteredItems.length === 0 ? (
          <YStack flex={1}>
            <H6 theme="alt1">No Users Found</H6>
          </YStack>
        ) : null
      }
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

export default Following;
