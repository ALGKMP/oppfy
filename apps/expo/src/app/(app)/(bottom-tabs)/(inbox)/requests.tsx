import React, { useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { Button, H5, Spacer, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { VirtualizedListItem } from "~/components/ListItems";
import { BaseScreenView } from "~/components/Views";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const PAGE_SIZE = 20;

type FriendRequestItem =
  RouterOutputs["friend"]["paginateFriendRequests"]["items"][0];
type FollowRequestItem =
  RouterOutputs["follow"]["paginateFollowRequests"]["items"][0];

const Requests = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const utils = api.useUtils();

  const [refreshing, setRefreshing] = useState(false);

  const {
    data: friendRequestsData,
    isLoading: friendRequestsIsLoading,
    hasNextPage: friendRequestsHasNextPage,
    fetchNextPage: fetchNextFriendRequestsPage,
    isFetchingNextPage: friendRequestsIsFetchingNextPage,
    refetch: refetchFriendRequests,
  } = api.friend.paginateFriendRequests.useInfiniteQuery(
    {
      pageSize: PAGE_SIZE,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  const {
    data: followRequestsData,
    isLoading: followRequestsIsLoading,
    hasNextPage: followRequestsHasNextPage,
    fetchNextPage: fetchNextFollowRequestsPage,
    isFetchingNextPage: followRequestsIsFetchingNextPage,
    refetch: refetchFollowRequests,
  } = api.follow.paginateFollowRequests.useInfiniteQuery(
    {
      pageSize: PAGE_SIZE,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const acceptFriendRequest = api.friend.acceptFriendRequest.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.friend.paginateFriendRequests.cancel();
      await utils.follow.paginateFollowRequests.cancel();
      await utils.profile.getFullProfileSelf.cancel();
      await utils.friend.paginateFriendsSelf.cancel();

      // Get the data from the queryCache
      const prevFriendData =
        utils.friend.paginateFriendRequests.getInfiniteData({
          pageSize: 20,
        });
      const prevFollowData =
        utils.follow.paginateFollowRequests.getInfiniteData({
          pageSize: 20,
        });

      if (prevFriendData === undefined || prevFollowData === undefined) return;

      // Optimistically update the data
      utils.friend.paginateFriendRequests.setInfiniteData(
        { pageSize: 20 },
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

      // Optimistically update the follow requests data
      utils.follow.paginateFollowRequests.setInfiniteData(
        { pageSize: 20 },
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
      // Sync with server once mutation has settled
      await utils.friend.paginateFriendRequests.invalidate();
      await utils.follow.paginateFollowRequests.invalidate();
      await utils.profile.getFullProfileSelf.invalidate();
      await utils.friend.paginateFriendsSelf.invalidate();
    },
  });
  const acceptFollowRequest = api.follow.acceptFollowRequest.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.follow.paginateFollowRequests.cancel();
      await utils.follow.paginateFollowersSelf.cancel();
      await utils.profile.getFullProfileSelf.cancel();
      // Get the data from the queryCache
      const prevData = utils.follow.paginateFollowRequests.getInfiniteData({
        pageSize: 20,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.follow.paginateFollowRequests.setInfiniteData(
        { pageSize: 20 },
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
      // Sync with server once mutation has settled
      await utils.follow.paginateFollowRequests.invalidate();
      await utils.follow.paginateFollowersSelf.invalidate();
      await utils.profile.getFullProfileSelf.invalidate();
    },
  });

  const declineFriendRequest = api.friend.declineFriendRequest.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.friend.paginateFriendRequests.cancel();

      // Get the data from the queryCache
      const prevFriendData =
        utils.friend.paginateFriendRequests.getInfiniteData();
      const prevFollowData =
        utils.follow.paginateFollowRequests.getInfiniteData();
      if (prevFriendData === undefined || prevFollowData === undefined) return;

      // Optimistically update the data
      utils.friend.paginateFriendRequests.setInfiniteData(
        { pageSize: 20 },
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

      // Optimistically update the follow requests data
      utils.follow.paginateFollowRequests.setInfiniteData(
        { pageSize: 20 },
        {
          ...prevFollowData,
        },
      );

      return { prevFriendData, prevFollowData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      utils.friend.paginateFriendRequests.setInfiniteData(
        { pageSize: 20 },
        ctx.prevFriendData,
      );
      utils.follow.paginateFollowRequests.setInfiniteData(
        { pageSize: 20 },
        ctx.prevFollowData,
      );
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.friend.paginateFriendRequests.invalidate();
      await utils.follow.paginateFollowRequests.invalidate();
    },
  });
  const declineFollowRequest = api.follow.declineFollowRequest.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches
      await utils.follow.paginateFollowRequests.cancel();
      await utils.friend.paginateFriendRequests.cancel();

      // Get the data from the queryCache
      const prevFollowData =
        utils.follow.paginateFollowRequests.getInfiniteData({ pageSize: 20 });
      const prevFriendData =
        utils.friend.paginateFriendRequests.getInfiniteData({ pageSize: 20 });

      if (prevFollowData === undefined || prevFriendData === undefined) return;

      // Optimistically update the follow requests data
      utils.follow.paginateFollowRequests.setInfiniteData(
        { pageSize: 20 },
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

      // Optimistically update the friend requests data
      utils.friend.paginateFriendRequests.setInfiniteData(
        { pageSize: 20 },
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

      return { prevFollowData, prevFriendData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      utils.follow.paginateFollowRequests.setInfiniteData(
        { pageSize: 20 },
        ctx.prevFollowData,
      );
      utils.friend.paginateFriendRequests.setInfiniteData(
        { pageSize: 20 },
        ctx.prevFriendData,
      );
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.follow.paginateFollowRequests.invalidate();
      await utils.friend.paginateFriendRequests.invalidate();
    },
  });

  const friendRequestItems = useMemo(
    () => friendRequestsData?.pages.flatMap((page) => page.items) ?? [],
    [friendRequestsData],
  );
  const followRequestItems = useMemo(
    () => followRequestsData?.pages.flatMap((page) => page.items) ?? [],
    [followRequestsData],
  );

  const onAcceptFriendRequest = async (senderId: string) => {
    await acceptFriendRequest.mutateAsync({ senderId });
  };
  const onAcceptFollowRequest = async (senderId: string) => {
    await acceptFollowRequest.mutateAsync({ senderId });
  };

  const onDeclineFriendRequest = async (senderId: string) => {
    await declineFriendRequest.mutateAsync({ senderId });
  };
  const onDeclineFollowRequest = async (senderId: string) => {
    await declineFollowRequest.mutateAsync({ senderId });
  };

  const onShowMoreFriendRequests = async () => {
    if (friendRequestsHasNextPage && !friendRequestsIsFetchingNextPage) {
      await fetchNextFriendRequestsPage();
    }
  };
  const onShowMoreFollowRequests = async () => {
    if (followRequestsHasNextPage && !followRequestsIsFetchingNextPage) {
      await fetchNextFollowRequestsPage();
    }
  };

  const onFriendRequestUserSelected = ({
    userId,
    username,
  }: FriendRequestItem) => {
    router.navigate({
      // pathname: "/(inbox)/profile/[userId]",
      pathname: "/(app)/(bottom-tabs)/( inbox)/profile/[userId]", // TODO: Typescript keeps yelling about this.
      params: { userId, username },
    });
  };

  const onFollowRequestUserSelected = ({
    userId,
    username,
  }: FollowRequestItem) => {
    router.navigate({
      // pathname: "/(inbox)/profile/[userId]",
      pathname: "/(app)/(bottom-tabs)/( inbox)/profile/[userId]", // TODO: Typescript keeps yelling about this.
      params: { userId, username },
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchFriendRequests(), refetchFollowRequests()]);
    setRefreshing(false);
  };

  const isLoading = followRequestsIsLoading || friendRequestsIsLoading;

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
            subtitle2: true,
            button: true,
            button2: true,
          }}
        />
      ))}
    </CardContainer>
  );

  const renderFriendRequests = () => (
    <CardContainer>
      <H5 theme="alt1">Friend Requests</H5>

      {friendRequestItems.map((item, index) => (
        <VirtualizedListItem
          key={index}
          loading={false}
          title={item.username}
          subtitle={item.name}
          imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
          button={{
            text: "Accept",
            backgroundColor: "#F214FF",
            onPress: () => void onAcceptFriendRequest(item.userId),
          }}
          button2={{
            text: "Decline",
            onPress: () => void onDeclineFriendRequest(item.userId),
          }}
          onPress={() => onFriendRequestUserSelected(item)}
        />
      ))}

      {friendRequestItems.length > PAGE_SIZE && (
        <>
          <Spacer size="$2" />
          <Button
            onPress={onShowMoreFriendRequests}
            disabled={friendRequestsIsFetchingNextPage}
          >
            Show more
          </Button>
        </>
      )}
    </CardContainer>
  );

  const renderFollowRequests = () => (
    <CardContainer>
      <H5 theme="alt1">Follow Requests</H5>

      {followRequestItems.map((item, index) => (
        <VirtualizedListItem
          key={index}
          loading={false}
          title={item.username}
          subtitle={item.name}
          imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
          button={{
            text: "Accept",
            backgroundColor: "#F214FF",
            onPress: () => void onAcceptFollowRequest(item.userId),
          }}
          button2={{
            text: "Decline",
            onPress: () => void onDeclineFollowRequest(item.userId),
          }}
          onPress={() => onFollowRequestUserSelected(item)}
        />
      ))}

      {followRequestItems.length > PAGE_SIZE && (
        <>
          <Spacer size="$2" />
          <Button
            onPress={onShowMoreFollowRequests}
            disabled={followRequestsIsFetchingNextPage}
          >
            Show more
          </Button>
        </>
      )}
    </CardContainer>
  );

  if (isLoading) {
    return (
      <BaseScreenView scrollable>{renderLoadingSkeletons()}</BaseScreenView>
    );
  }

  return (
    <BaseScreenView
      scrollable
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <YStack flex={1} gap="$4" paddingBottom={insets.bottom}>
        {friendRequestItems.length > 0 && renderFriendRequests()}
        {followRequestItems.length > 0 && renderFollowRequests()}
      </YStack>
    </BaseScreenView>
  );
};

export default Requests;
