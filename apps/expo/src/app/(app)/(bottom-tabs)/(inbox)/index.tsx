import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import {
  UserCheck,
  UserPlus,
  UserRoundCheck,
  UserRoundPlus,
} from "@tamagui/lucide-icons";
import { Skeleton } from "moti/skeleton";
import {
  Circle,
  Paragraph,
  Separator,
  SizableText,
  Spacer,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import { abbreviatedTimeAgo } from "@oppfy/utils";

import { VirtualizedListItem } from "~/components/ListItems";
import { BaseScreenView } from "~/components/Views";
import { ListHeader } from "~/features/connections/components";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const Inbox = () => {
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);

  const utils = api.useUtils();

  const {
    data: requestsCount,
    isLoading: isCountRequestsLoading,
    refetch: refetchRequestCount,
  } = api.request.countRequests.useQuery();

  const totalRequestCount =
    (requestsCount?.followRequestCount ?? 0) +
    (requestsCount?.friendRequestCount ?? 0);

  const {
    data: notificationsData,
    isLoading: isNotificationsLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchNotifications,
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

  const followUser = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.notifications.paginateNotifications.cancel();

      // Get the data from the queryCache
      const prevData =
        utils.notifications.paginateNotifications.getInfiniteData();
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.notifications.paginateNotifications.setInfiniteData(
        {},
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.userId === newData.userId
                ? {
                    ...item,
                    relationshipState:
                      item.privacySetting === "private"
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
      utils.notifications.paginateNotifications.setInfiniteData(
        {},
        ctx.prevData,
      );
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.notifications.paginateNotifications.invalidate();
    },
  });

  const onUserSelected = (profileId: number) => {
    router.navigate({
      pathname: "/(inbox)/profile/[profile-id]/",
      params: { profileId: String(profileId) },
    });
  };

  const onFollowUser = async (userId: string) => {
    await followUser.mutateAsync({ userId });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchNotifications(), refetchRequestCount()]);
    setRefreshing(false);
  }, [refetchNotifications]);

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
      <BaseScreenView scrollable>
        <YStack gap="$4">
          <Skeleton.Group show={true}>
            <View padding="$4" borderRadius="$6" backgroundColor="$gray2">
              <YStack>
                <Skeleton width={150}>
                  <SizableText size="$6" fontWeight="bold">
                    Loading...
                  </SizableText>
                </Skeleton>
                <Spacer size="$1" />
                <Skeleton width={300}>
                  <Paragraph theme="alt1">Loading...</Paragraph>
                </Skeleton>
              </YStack>
            </View>
          </Skeleton.Group>

          <View
            paddingVertical="$2"
            paddingHorizontal="$3"
            borderRadius="$6"
            backgroundColor="$gray2"
          >
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
          </View>
        </YStack>
      </BaseScreenView>
    );
  }

  return (
    <BaseScreenView
      scrollable
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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
              estimatedItemSize={75}
              onEndReached={handleOnEndReached}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const buttonProps = (() => {
                  switch (item.relationshipState) {
                    case "notFollowing":
                      return {
                        text: "Follow",
                        icon: UserRoundPlus,
                      };
                    case "following":
                      return {
                        text: "Following",
                        icon: UserRoundCheck,
                      };
                    case "followRequestSent":
                      return {
                        text: "Requested",
                        icon: UserRoundCheck,
                      };
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
                    subtitle2={abbreviatedTimeAgo(item.createdAt)}
                    button={{
                      ...buttonProps,
                      disabled: buttonDisabled,
                      disabledStyle: { opacity: 0.5 },
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
