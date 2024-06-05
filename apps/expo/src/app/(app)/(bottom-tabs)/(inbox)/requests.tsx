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
  const { data: followRequestsData, isLoading: isLoadingFollowRequests } =
    api.request.paginateFollowRequests.useInfiniteQuery(
      {
        pageSize: PAGE_SIZE,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const { data: friendRequestsData, isLoading: isLoadingFriendRequests } =
    api.request.paginateFriendRequests.useInfiniteQuery(
      {
        pageSize: PAGE_SIZE,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const followRequestItems = useMemo(
    () => followRequestsData?.pages.flatMap((page) => page.items) ?? [],
    [followRequestsData],
  );

  const friendRequestItems = useMemo(
    () => friendRequestsData?.pages.flatMap((page) => page.items) ?? [],
    [friendRequestsData],
  );

  const isLoading = isLoadingFollowRequests || isLoadingFriendRequests;

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
                  onPress: () => console.log("Accept"),
                }}
                button2={{
                  text: "Decline",
                  onPress: () => console.log("Decline"),
                }}
              />
            ))}
            <Button>Show more</Button>
          </View>
        )}

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
                  onPress: () => console.log("Accept"),
                }}
                button2={{
                  text: "Decline",
                  onPress: () => console.log("Decline"),
                }}
              />
            ))}
            {friendRequestItems.length > PAGE_SIZE && (
              <>
                <Spacer size="$2" />
                <Button>Show more</Button>
              </>
            )}
          </View>
        )}
      </YStack>
    </BaseScreenView>
  );
};

export default Requests;
