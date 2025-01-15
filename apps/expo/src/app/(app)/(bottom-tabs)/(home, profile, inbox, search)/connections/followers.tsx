import React, { useState } from "react";
import { RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { Send, UserRoundMinus, UserRoundPlus } from "@tamagui/lucide-icons";
import { getToken, H6, YStack } from "tamagui";

import { SearchInput } from "~/components/Inputs";
import type {
  MediaListItemActionProps} from "~/components/ui";
import {
  MediaListItem,
  useActionSheetController,
} from "~/components/ui";
import { Spacer } from "~/components/ui/Spacer";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { useSession } from "~/contexts/SessionContext";
import useRouteProfile from "~/hooks/useRouteProfile";
import useSearch from "~/hooks/useSearch";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type FollowerItem =
  RouterOutputs["follow"]["paginateFollowersOthers"]["items"][0];

const PAGE_SIZE = 20;

const Followers = () => {
  const utils = api.useUtils();
  const actionSheet = useActionSheetController();

  const { userId } = useLocalSearchParams<{ userId: string }>();

  const { user } = useSession();
  const { routeProfile } = useRouteProfile();

  const [refreshing, setRefreshing] = useState(false);

  const followMutation = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      await utils.follow.paginateFollowersOthers.cancel({
        userId,
        pageSize: PAGE_SIZE,
      });

      const prevData = utils.follow.paginateFollowersOthers.getInfiniteData({
        userId,
        pageSize: PAGE_SIZE,
      });
      if (prevData === undefined) return;

      utils.follow.paginateFollowersOthers.setInfiniteData(
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
      // Refetch latest data since our optimistic update may be outdated
      void utils.follow.paginateFollowersOthers.invalidate({
        userId,
        pageSize: PAGE_SIZE,
      });
    },
  });

  const unfollowMutation = api.follow.unfollowUser.useMutation({
    onMutate: async (newData) => {
      await utils.follow.paginateFollowersOthers.cancel({
        userId,
        pageSize: PAGE_SIZE,
      });

      const prevData = utils.follow.paginateFollowersOthers.getInfiniteData({
        userId,
        pageSize: PAGE_SIZE,
      });
      if (prevData === undefined) return;

      utils.follow.paginateFollowersOthers.setInfiniteData(
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
      // Refetch latest data since our optimistic update may be outdated
      void utils.follow.paginateFollowersOthers.invalidate({
        userId,
        pageSize: PAGE_SIZE,
      });
    },
  });

  const cancelFollowRequest = api.follow.cancelFollowRequest.useMutation({
    onMutate: async (newData) => {
      await utils.follow.paginateFollowersOthers.cancel({
        userId,
        pageSize: PAGE_SIZE,
      });

      const prevData = utils.follow.paginateFollowersOthers.getInfiniteData({
        userId,
        pageSize: PAGE_SIZE,
      });
      if (prevData === undefined) return;

      utils.follow.paginateFollowersOthers.setInfiniteData(
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
      // Refetch latest data since our optimistic update may be outdated
      void utils.follow.paginateFollowersOthers.invalidate({
        userId,
        pageSize: PAGE_SIZE,
      });
    },
  });

  const {
    data: followersData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.follow.paginateFollowersOthers.useInfiniteQuery(
    { userId, pageSize: PAGE_SIZE },
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

  const handleFollow = async (userId: string) => {
    await followMutation.mutateAsync({ userId });
  };

  const handleUnfollow = async (userId: string) => {
    await unfollowMutation.mutateAsync({ userId });
  };

  const handleCancelFollowRequest = async (userId: string) => {
    await cancelFollowRequest.mutateAsync({ recipientId: userId });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderActionButton = (
    item: FollowerItem,
  ): MediaListItemActionProps | undefined => {
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
          variant: "primary",
          onPress: () => void handleFollow(item.userId),
        };
    }
  };

  const renderListItem = (item: FollowerItem) => (
    <MediaListItem
      title={item.username}
      subtitle={item.name}
      imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
      primaryAction={renderActionButton(item)}
      onPress={() =>
        routeProfile({ userId: item.userId, username: item.username })
      }
    />
  );

  const ListHeaderComponent = (
    <YStack gap="$4">
      <SearchInput
        placeholder="Search followers..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery("")}
      />
    </YStack>
  );

  const ListEmptyComponent = () => {
    if (isLoading) {
      return (
        <YStack gap="$2.5">
          {Array.from({ length: 20 }).map((_, index) => (
            <MediaListItem.Skeleton key={index} />
          ))}
        </YStack>
      );
    }

    if (followerItems.length === 0) {
      return (
        <YStack flex={1} justifyContent="center">
          <EmptyPlaceholder
            title="No followers"
            subtitle="No followers found."
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
  };

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

export default Followers;
