import React, { useMemo } from "react";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Button, Separator, Spacer, Text, View, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { VirtualizedListItem } from "~/components/ListItems";
import { BaseScreenView } from "~/components/Views";
import { ListHeader } from "~/features/connections/components";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const PAGE_SIZE = 5;

const Requests = () => {
  const router = useRouter();
  const utils = api.useUtils();

  const {
    data: friendRequestsData,
    isLoading: friendRequestsIsLoading,
    hasNextPage: friendRequestsHasNextPage,
    fetchNextPage: fetchNextFriendRequestsPage,
    isFetchingNextPage: friendRequestsIsFetchingNextPage,
  } = api.request.paginateFriendRequests.useInfiniteQuery(
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
  } = api.request.paginateFollowRequests.useInfiniteQuery(
    {
      pageSize: PAGE_SIZE,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const acceptFriendRequest = api.request.acceptFriendRequest.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.request.paginateFriendRequests.cancel();

      // Get the data from the queryCache
      const prevData = utils.request.paginateFriendRequests.getInfiniteData();
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.request.paginateFriendRequests.setInfiniteData(
        {},
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
      utils.request.paginateFriendRequests.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.request.paginateFriendRequests.invalidate();
    },
  });
  const acceptFollowRequest = api.request.acceptFollowRequest.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.request.paginateFollowRequests.cancel();

      // Get the data from the queryCache
      const prevData = utils.request.paginateFollowRequests.getInfiniteData();
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.request.paginateFollowRequests.setInfiniteData(
        {},
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
      utils.request.paginateFollowRequests.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.request.paginateFollowRequests.invalidate();
    },
  });

  const declineFriendRequest = api.request.declineFollowRequest.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.request.paginateFriendRequests.cancel();

      // Get the data from the queryCache
      const prevData = utils.request.paginateFriendRequests.getInfiniteData();
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.request.paginateFriendRequests.setInfiniteData(
        {},
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
      utils.request.paginateFriendRequests.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.request.paginateFriendRequests.invalidate();
    },
  });
  const declineFollowRequest = api.request.declineFollowRequest.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.request.paginateFollowRequests.cancel();

      // Get the data from the queryCache
      const prevData = utils.request.paginateFollowRequests.getInfiniteData();
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.request.paginateFollowRequests.setInfiniteData(
        {},
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
      utils.request.paginateFollowRequests.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.request.paginateFollowRequests.invalidate();
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

  const onUserSelected = (profileId: number) => {
    router.navigate({
      pathname: "/(inbox)/profile/[profile-id]/",
      params: { profileId: String(profileId) },
    });
  };

  const isLoading = followRequestsIsLoading || friendRequestsIsLoading;

  const renderLoadingSkeletons = () => (
    <BaseScreenView scrollable>
      <CardContainer>
        <FlashList
          data={PLACEHOLDER_DATA}
          estimatedItemSize={75}
          showsVerticalScrollIndicator={false}
          renderItem={() => (
            <VirtualizedListItem
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
          )}
        />
      </CardContainer>
    </BaseScreenView>
  );

  const renderFriendRequests = () => (
    <CardContainer>
      <ListHeader title="FRIEND REQUESTS" />

      {friendRequestItems.map((item, index) => (
        <VirtualizedListItem
          key={index}
          loading={false}
          title={item.username}
          subtitle={item.name}
          imageUrl={item.profilePictureUrl}
          button={{
            text: "Accept",
            theme: "blue",
            onPress: () => onAcceptFriendRequest(item.userId),
          }}
          button2={{
            text: "Decline",
            onPress: () => onDeclineFriendRequest(item.userId),
          }}
          onPress={() => onUserSelected(item.profileId)}
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
      <ListHeader title="FOLLOW REQUESTS" />

      {followRequestItems.map((item, index) => (
        <VirtualizedListItem
          key={index}
          loading={false}
          title={item.username}
          subtitle={item.name}
          imageUrl={item.profilePictureUrl}
          button={{
            text: "Accept",
            onPress: () => onAcceptFollowRequest(item.userId),
          }}
          button2={{
            text: "Decline",
            onPress: () => onDeclineFollowRequest(item.userId),
          }}
          onPress={() => onUserSelected(item.profileId)}
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
    return renderLoadingSkeletons();
  }

  return (
    <BaseScreenView scrollable paddingBottom={0}>
      <YStack flex={1} gap="$4">
        {friendRequestItems.length > 0 && renderFriendRequests()}
        {followRequestItems.length > 0 && renderFollowRequests()}
      </YStack>
    </BaseScreenView>
  );
};

export default Requests;
