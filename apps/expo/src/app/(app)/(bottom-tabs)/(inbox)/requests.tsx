import React, { useState } from "react";
import { RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { getToken, H5, Spacer, YStack } from "tamagui";

import { MediaListItem } from "~/components/ui";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { api, type RouterOutputs } from "~/utils/api";

type FriendRequestItem =
  RouterOutputs["friend"]["paginateFriendRequests"]["items"][0];
type FollowRequestItem =
  RouterOutputs["follow"]["paginateFollowRequests"]["items"][0];

type ListItem =
  | { type: "header"; title: string }
  | { type: "friendRequest"; data: FriendRequestItem }
  | { type: "followRequest"; data: FollowRequestItem };

const PAGE_SIZE = 20;

const Requests = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = api.useUtils();
  const [refreshing, setRefreshing] = useState(false);

  // Friend Requests Query
  const {
    data: friendRequestsData,
    isLoading: friendRequestsIsLoading,
    hasNextPage: friendRequestsHasNextPage,
    fetchNextPage: fetchNextFriendRequestsPage,
    isFetchingNextPage: friendRequestsIsFetchingNextPage,
    refetch: refetchFriendRequests,
  } = api.friend.paginateFriendRequests.useInfiniteQuery(
    { pageSize: PAGE_SIZE },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  // Follow Requests Query
  const {
    data: followRequestsData,
    isLoading: followRequestsIsLoading,
    hasNextPage: followRequestsHasNextPage,
    fetchNextPage: fetchNextFollowRequestsPage,
    isFetchingNextPage: followRequestsIsFetchingNextPage,
    refetch: refetchFollowRequests,
  } = api.follow.paginateFollowRequests.useInfiniteQuery(
    { pageSize: PAGE_SIZE },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  // Accept/Decline Mutations
  const acceptFriendRequest = api.friend.acceptFriendRequest.useMutation({
    onMutate: async (newData) => {
      await utils.friend.paginateFriendRequests.cancel();
      await utils.follow.paginateFollowRequests.cancel();
      await utils.profile.getFullProfileSelf.cancel();
      await utils.friend.paginateFriendsSelf.cancel();

      const prevFriendData =
        utils.friend.paginateFriendRequests.getInfiniteData({
          pageSize: PAGE_SIZE,
        });
      const prevFollowData =
        utils.follow.paginateFollowRequests.getInfiniteData({
          pageSize: PAGE_SIZE,
        });

      if (prevFriendData === undefined || prevFollowData === undefined) return;

      utils.friend.paginateFriendRequests.setInfiniteData(
        { pageSize: PAGE_SIZE },
        {
          ...prevFriendData,
          pages: prevFriendData.pages.map((page) => ({
            ...page,
            items: page.items.filter(
              (item) => item.userId !== newData.senderId,
            ),
          })),
        },
      );

      utils.follow.paginateFollowRequests.setInfiniteData(
        { pageSize: PAGE_SIZE },
        {
          ...prevFollowData,
          pages: prevFollowData.pages.map((page) => ({
            ...page,
            items: page.items.filter(
              (item) => item.userId !== newData.senderId,
            ),
          })),
        },
      );

      return { prevFriendData, prevFollowData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      utils.friend.paginateFriendRequests.setInfiniteData(
        {},
        ctx.prevFriendData,
      );
      utils.follow.paginateFollowRequests.setInfiniteData(
        {},
        ctx.prevFollowData,
      );
    },
    onSettled: async () => {
      await utils.friend.paginateFriendRequests.invalidate();
      await utils.follow.paginateFollowRequests.invalidate();
      await utils.profile.getFullProfileSelf.invalidate();
      await utils.friend.paginateFriendsSelf.invalidate();
    },
  });

  const acceptFollowRequest = api.follow.acceptFollowRequest.useMutation({
    onMutate: async (newData) => {
      await utils.follow.paginateFollowRequests.cancel();
      await utils.follow.paginateFollowersSelf.cancel();
      await utils.profile.getFullProfileSelf.cancel();

      const prevData = utils.follow.paginateFollowRequests.getInfiniteData({
        pageSize: PAGE_SIZE,
      });
      if (prevData === undefined) return;

      utils.follow.paginateFollowRequests.setInfiniteData(
        { pageSize: PAGE_SIZE },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.filter(
              (item) => item.userId !== newData.senderId,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      utils.follow.paginateFollowRequests.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      await utils.follow.paginateFollowRequests.invalidate();
      await utils.follow.paginateFollowersSelf.invalidate();
      await utils.profile.getFullProfileSelf.invalidate();
    },
  });

  const declineFriendRequest = api.friend.declineFriendRequest.useMutation({
    onMutate: async (newData) => {
      await utils.friend.paginateFriendRequests.cancel();
      const prevData = utils.friend.paginateFriendRequests.getInfiniteData({
        pageSize: PAGE_SIZE,
      });
      if (prevData === undefined) return;

      utils.friend.paginateFriendRequests.setInfiniteData(
        { pageSize: PAGE_SIZE },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.filter(
              (item) => item.userId !== newData.senderId,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      utils.friend.paginateFriendRequests.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      await utils.friend.paginateFriendRequests.invalidate();
    },
  });

  const declineFollowRequest = api.follow.declineFollowRequest.useMutation({
    onMutate: async (newData) => {
      await utils.follow.paginateFollowRequests.cancel();
      const prevData = utils.follow.paginateFollowRequests.getInfiniteData({
        pageSize: PAGE_SIZE,
      });
      if (prevData === undefined) return;

      utils.follow.paginateFollowRequests.setInfiniteData(
        { pageSize: PAGE_SIZE },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.filter(
              (item) => item.userId !== newData.senderId,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      utils.follow.paginateFollowRequests.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      await utils.follow.paginateFollowRequests.invalidate();
    },
  });

  const friendRequestItems =
    friendRequestsData?.pages.flatMap((page) => page.items) ?? [];
  const followRequestItems =
    followRequestsData?.pages.flatMap((page) => page.items) ?? [];

  const items: ListItem[] = [];
  if (friendRequestItems.length > 0) {
    items.push({ type: "header", title: "Friend Requests" });
    friendRequestItems.forEach((item: FriendRequestItem) =>
      items.push({ type: "friendRequest", data: item }),
    );
  }
  if (followRequestItems.length > 0) {
    items.push({ type: "header", title: "Follow Requests" });
    followRequestItems.forEach((item: FollowRequestItem) =>
      items.push({ type: "followRequest", data: item }),
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchFriendRequests(), refetchFollowRequests()]);
    setRefreshing(false);
  };

  const handleOnEndReached = async () => {
    if (friendRequestsHasNextPage && !friendRequestsIsFetchingNextPage) {
      await fetchNextFriendRequestsPage();
    }
    if (followRequestsHasNextPage && !followRequestsIsFetchingNextPage) {
      await fetchNextFollowRequestsPage();
    }
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "header") {
      return <H5 theme="alt1">{item.title}</H5>;
    }

    if (item.type === "friendRequest") {
      return (
        <MediaListItem
          title={item.data.username}
          subtitle={item.data.name}
          imageUrl={item.data.profilePictureUrl ?? DefaultProfilePicture}
          primaryAction={{
            label: "Decline",
            onPress: () =>
              void declineFriendRequest.mutateAsync({
                senderId: item.data.userId,
              }),
          }}
          secondaryAction={{
            label: "Accept",
            variant: "primary",
            onPress: () =>
              void acceptFriendRequest.mutateAsync({
                senderId: item.data.userId,
              }),
          }}
          onPress={() =>
            router.navigate({
              pathname: "/profile/[userId]",
              params: {
                userId: item.data.userId,
                username: item.data.username,
              },
            })
          }
        />
      );
    }

    return (
      <MediaListItem
        title={item.data.username}
        subtitle={item.data.name}
        imageUrl={item.data.profilePictureUrl ?? DefaultProfilePicture}
        primaryAction={{
          label: "Decline",
          onPress: () =>
            void declineFollowRequest.mutateAsync({
              senderId: item.data.userId,
            }),
        }}
        secondaryAction={{
          label: "Accept",
          variant: "primary",
          onPress: () =>
            void acceptFollowRequest.mutateAsync({
              senderId: item.data.userId,
            }),
        }}
        onPress={() =>
          router.navigate({
            pathname: "/profile/[userId]",
            params: {
              userId: item.data.userId,
              username: item.data.username,
            },
          })
        }
      />
    );
  };

  const ListEmptyComponent = () => {
    if (friendRequestsIsLoading || followRequestsIsLoading) {
      return (
        <YStack gap="$4">
          {Array.from({ length: 10 }).map((_, index) => (
            <MediaListItem.Skeleton key={index} />
          ))}
        </YStack>
      );
    }

    return (
      <YStack flex={1} justifyContent="center">
        <EmptyPlaceholder
          title="No requests"
          subtitle="You don't have any pending requests."
        />
      </YStack>
    );
  };

  const getItemType = (item: ListItem) => {
    return item.type;
  };

  const keyExtractor = (item: ListItem) => {
    switch (item.type) {
      case "header":
        return `header-${item.title}`;
      case "friendRequest":
      case "followRequest":
        return `request-${item.data.userId}`;
    }
  };

  return (
    <FlashList
      data={items}
      renderItem={renderItem}
      estimatedItemSize={75}
      getItemType={getItemType}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={Spacer}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={{
        padding: getToken("$4", "space"),
        paddingBottom: insets.bottom + getToken("$2", "space"),
      }}
      onEndReached={handleOnEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    />
  );
};

export default Requests;
