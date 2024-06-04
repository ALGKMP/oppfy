import React from "react";
import { FlashList } from "@shopify/flash-list";
import { Separator, Text, View, YStack } from "tamagui";

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
    return (
      <BaseScreenView paddingBottom={0}>
        <YStack flex={1} gap="$4">
          <View
            flex={1}
            borderRadius="$6"
            paddingHorizontal="$4"
            backgroundColor="$gray2"
          >
            <FlashList
              data={PLACEHOLDER_DATA}
              ItemSeparatorComponent={Separator}
              estimatedItemSize={75}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View marginTop="$3">
                  <ListHeader title="FRIEND REQUESTS" />
                </View>
              }
              renderItem={() => (
                <VirtualizedListItem
                  loading
                  showSkeletons={{
                    imageUrl: true,
                    title: true,
                    subtitle: true,
                    button: true,
                    button2: true,
                  }}
                />
              )}
            />
          </View>

          <View
            flex={1}
            borderRadius="$6"
            paddingHorizontal="$4"
            backgroundColor="$gray2"
          >
            <FlashList
              data={PLACEHOLDER_DATA}
              ItemSeparatorComponent={Separator}
              estimatedItemSize={75}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View marginTop="$3">
                  <ListHeader title="FRIEND REQUESTS" />
                </View>
              }
              renderItem={() => (
                <VirtualizedListItem
                  loading
                  showSkeletons={{
                    imageUrl: true,
                    title: true,
                    subtitle: true,
                    button: true,
                    button2: true,
                  }}
                />
              )}
            />
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
