import React, { useEffect, useMemo } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import {
  Circle,
  Paragraph,
  Separator,
  SizableText,
  View,
  XStack,
  YStack,
} from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import { BaseScreenView } from "~/components/Views";
import { ListHeader } from "~/features/connections/components";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const Inbox = () => {
  const router = useRouter();

  const { data: requestsCount, isLoading: isCountRequestsLoading } =
    api.request.countRequests.useQuery();

  const totalRequestCount =
    (requestsCount?.followRequestCount ?? 0) +
    (requestsCount?.friendRequestCount ?? 0);

  const {
    data: notificationsData,
    isLoading: isNotificationsLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.notifications.paginateNotifications.useInfiniteQuery(
    {
      pageSize: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const notificationItems = useMemo(
    () => notificationsData?.pages.flatMap((page) => page.items) ?? [],
    [notificationsData],
  );

  const handleOnEndReached = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  const followUser = api.follow.followUser.useMutation();

  const onUserSelected = (profileId: number) => {
    router.navigate({
      pathname: "/(inbox)/profile/[profile-id]/",
      params: { profileId: String(profileId) },
    });
  };

  const onFollowUser = async (userId: string) => {
    await followUser.mutateAsync({ userId });
  };

  const renderRequestCount = () =>
    totalRequestCount > 99 ? (
      <XStack>
        <SizableText size="$4" color="white" fontWeight="bold">
          99
        </SizableText>
        <SizableText size="$2">+</SizableText>
      </XStack>
    ) : (
      <SizableText size="$4" color="white" fontWeight="bold">
        {totalRequestCount}
      </SizableText>
    );

  if (isCountRequestsLoading || isNotificationsLoading) {
    return (
      <BaseScreenView paddingBottom={0}>
        <FlashList
          data={PLACEHOLDER_DATA}
          ItemSeparatorComponent={Separator}
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
              }}
            />
          )}
        />
      </BaseScreenView>
    );
  }

  return (
    <BaseScreenView scrollable>
      <YStack gap="$4">
        {totalRequestCount > 0 && (
          <TouchableOpacity onPress={() => router.navigate("/requests")}>
            <View padding="$4" borderRadius="$6" backgroundColor="$gray2">
              <YStack>
                <SizableText size="$6" fontWeight="bold">
                  Follow and Friend Requests
                </SizableText>
                <Paragraph theme="alt1">
                  Approve or ignore these requests
                </Paragraph>
              </YStack>
              <Circle
                size={totalRequestCount > 99 ? "$2.5" : "$2"}
                backgroundColor="$red9"
                style={styles.countContainer}
              >
                {renderRequestCount()}
              </Circle>
            </View>
          </TouchableOpacity>
        )}

        {notificationItems.length > 0 && (
          <View
            paddingVertical="$2"
            paddingHorizontal="$3"
            borderRadius="$6"
            backgroundColor="$gray2"
          >
            <FlashList
              data={notificationItems}
              onRefresh={refetch}
              refreshing={isNotificationsLoading}
              estimatedItemSize={75}
              onEndReached={handleOnEndReached}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const buttonText = (() => {
                  switch (item.relationshipState) {
                    case "notFollowing":
                      return "Follow";
                    case "following":
                      return "Following";
                    case "followRequestSent":
                      return "Requested";
                  }
                })();

                const buttonDisabled =
                  item.relationshipState === "following" ||
                  item.relationshipState === "followRequestSent";

                return (
                  <VirtualizedListItem
                    loading={false}
                    title={item.username ?? ""}
                    subtitle={item.message ?? ""}
                    subtitle2="1d ago"
                    button={{
                      text: buttonText,
                      disabled: buttonDisabled,
                      onPress: () => onFollowUser(item.userId),
                    }}
                    imageUrl={item.profilePictureUrl}
                    onPress={() => onUserSelected(item.profileId)}
                  />
                );
              }}
            />
          </View>
        )}
      </YStack>
    </BaseScreenView>
  );
};

const styles = StyleSheet.create({
  countContainer: {
    position: "absolute",
    top: -8,
    right: -8,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Inbox;
