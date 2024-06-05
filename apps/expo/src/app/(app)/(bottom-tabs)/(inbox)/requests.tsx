import React, { useMemo } from "react";
import { FlashList } from "@shopify/flash-list";
import { Button, Separator, Spacer, Text, View, YStack } from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import { BaseScreenView } from "~/components/Views";
import { ListHeader } from "~/features/connections/components";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const PAGE_SIZE = 5;

const Requests = () => {
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

  const acceptFriendRequest = api.request.acceptFriendRequest.useMutation();
  const acceptFollowRequest = api.request.acceptFollowRequest.useMutation();

  const declineFriendRequest = api.request.declineFollowRequest.useMutation();
  const declineFollowRequest = api.request.declineFollowRequest.useMutation();

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

  const isLoading = followRequestsIsLoading || friendRequestsIsLoading;

  if (isLoading) {
    const skeletonProps = {
      loading: true,
      showSkeletons: {
        title: true,
        subtitle: true,
        button: true,
        button2: true,
        imageUrl: true,
      },
    };

    return (
      <BaseScreenView scrollable paddingBottom={0}>
        <YStack flex={1} gap="$4">
          <View
            paddingVertical="$2"
            paddingHorizontal="$3"
            borderRadius="$6"
            backgroundColor="$gray2"
          >
            <ListHeader title="FRIEND REQUESTS" />
            {[...Array(5)].map((_, index) => (
              <VirtualizedListItem key={index} {...skeletonProps} />
            ))}
          </View>

          <View
            paddingVertical="$2"
            paddingHorizontal="$3"
            borderRadius="$6"
            backgroundColor="$gray2"
          >
            <ListHeader title="FOLLOW REQUESTS" />
            {[...Array(5)].map((_, index) => (
              <VirtualizedListItem key={index} {...skeletonProps} />
            ))}
          </View>
        </YStack>
      </BaseScreenView>
    );
  }

  return (
    <BaseScreenView scrollable paddingBottom={0}>
      <YStack flex={1} gap="$4">
        {friendRequestItems.length > 0 && (
          <View
            paddingVertical="$3"
            paddingHorizontal="$3"
            borderRadius="$6"
            backgroundColor="$gray2"
          >
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
          </View>
        )}

        {followRequestItems.length > 0 && (
          <View
            paddingVertical="$2"
            paddingHorizontal="$3"
            borderRadius="$6"
            backgroundColor="$gray2"
          >
            <ListHeader title="FRIEND REQUESTS" />

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
          </View>
        )}
      </YStack>
    </BaseScreenView>
  );
};

export default Requests;
