import React from "react";
import { FlashList } from "@shopify/flash-list";
import { Button, Separator, Text, View, YStack } from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import { BaseScreenView } from "~/components/Views";
import { ListHeader } from "~/features/connections/components";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const Requests = () => {
  const { data: followRequestsData, isLoading: isLoadingFollowRequests } =
    api.request.paginateFollowRequests.useInfiniteQuery(
      {
        pageSize: 5,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const { data: friendRequestsData, isLoading: isLoadingFriendRequests } =
    api.request.paginateFriendRequests.useInfiniteQuery(
      {
        pageSize: 5,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const isLoading = isLoadingFollowRequests || isLoadingFriendRequests;

  if (true) {
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
    <BaseScreenView>
      <VirtualizedListItem
        loading={false}
        title="Christina"
        subtitle="wants to be your friend"
      />
    </BaseScreenView>
  );
};

export default Requests;
