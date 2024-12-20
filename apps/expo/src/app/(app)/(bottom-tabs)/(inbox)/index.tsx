import React, { useCallback, useMemo, useRef, useState } from "react";
import { RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { UserRoundCheck, UserRoundPlus } from "@tamagui/lucide-icons";
import { getToken } from "tamagui";

import GridSuggestions from "~/components/GridSuggestions";
import {
  H5,
  MediaListItem,
  MediaListItemActionProps,
  MediaListItemSkeleton,
  Paragraph,
  YStack,
} from "~/components/ui";
import { Spacer } from "~/components/ui/Spacer";
import { TimeAgo } from "~/components/ui/TimeAgo";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import useRouteProfile from "~/hooks/useRouteProfile";
import { api, RouterOutputs } from "~/utils/api";

type NotificationItem =
  RouterOutputs["notifications"]["paginateNotifications"]["items"][0];

const REFETCH_INTERVAL = 1000 * 30;
const PAGE_SIZE = 50;

const Inbox = () => {
  const router = useRouter();
  const utils = api.useUtils();
  const { routeProfile } = useRouteProfile();

  const [refreshing, setRefreshing] = useState(false);

  const { data: requestsCount, refetch: refetchRequestCount } =
    api.request.countRequests.useQuery(undefined, {
      refetchInterval: REFETCH_INTERVAL,
      refetchOnWindowFocus: true,
    });

  const {
    data: notificationsData,
    isLoading: isNotificationsLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchNotifications,
  } = api.notifications.paginateNotifications.useInfiniteQuery(
    { pageSize: PAGE_SIZE },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: REFETCH_INTERVAL,
    },
  );

  // Flatten the paginated data into a single array
  const notificationItems = useMemo(
    () => notificationsData?.pages.flatMap((page) => page.items) ?? [],
    [notificationsData],
  );

  const followUser = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      await utils.notifications.paginateNotifications.cancel();
      const prevData =
        utils.notifications.paginateNotifications.getInfiniteData({
          pageSize: PAGE_SIZE,
        });
      if (prevData === undefined) return;

      utils.notifications.paginateNotifications.setInfiniteData(
        { pageSize: PAGE_SIZE },
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
        { pageSize: PAGE_SIZE },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      await utils.notifications.paginateNotifications.invalidate();
    },
  });

  const handleOnEndReached = useCallback(async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchNotifications(), refetchRequestCount()]);
    setRefreshing(false);
  }, [refetchNotifications, refetchRequestCount]);

  const getNotificationMessage = (item: NotificationItem) => {
    switch (item.eventType) {
      case "like":
        return "liked your post";
      case "post":
        return "has opped you";
      case "comment":
        return "commented on your post";
      case "follow":
        return "started following you";
      case "friend":
        return "is now your friend";
      default:
        return "";
    }
  };

  const renderActionButton = (
    item: NotificationItem,
  ): MediaListItemActionProps | undefined => {
    if (!item.userId) return undefined;
    switch (item.relationshipState) {
      case "notFollowing":
        return {
          label: "Follow",
          icon: UserRoundPlus,
          variant: "primary",
          onPress: () => void followUser.mutateAsync({ userId: item.userId }),
        };
      case "following":
        return {
          label: "Followed",
          icon: UserRoundCheck,
          disabled: true,
        };
      case "followRequestSent":
        return {
          label: "Sent",
          icon: UserRoundCheck,
          disabled: true,
        };
      default:
        return undefined;
    }
  };

  const renderListItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <MediaListItem
        verticalText
        title={item.username}
        subtitle={getNotificationMessage(item)}
        caption={<TimeAgo size="$2" suffix="ago" date={item.createdAt} />}
        imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
        primaryAction={renderActionButton(item)}
        onPress={() =>
          routeProfile({ userId: item.userId, username: item.username })
        }
      />
    ),
    [routeProfile, followUser],
  );

  const ListHeaderComponent = useMemo(() => {
    const pendingRequests =
      (requestsCount?.followRequestCount ?? 0) +
      (requestsCount?.friendRequestCount ?? 0);

    if (pendingRequests > 0) {
      return (
        <YStack gap="$4">
          <YStack
            backgroundColor="$background"
            padding="$4"
            borderRadius="$4"
            pressStyle={{ opacity: 0.7 }}
            onPress={() => router.navigate("/requests")}
          >
            <H5>Follow and Friend Requests</H5>
            <Paragraph theme="alt1">
              {pendingRequests} pending requests
            </Paragraph>
          </YStack>
        </YStack>
      );
    }
    return null;
  }, [requestsCount, router]);

  const ListEmptyComponent = useCallback(() => {
    if (isNotificationsLoading) {
      return (
        <YStack gap="$4">
          {Array.from({ length: 10 }).map((_, index) => (
            <MediaListItemSkeleton key={index} />
          ))}
        </YStack>
      );
    }

    if (notificationItems.length === 0) {
      return (
        <YStack flex={1} justifyContent="center">
          <EmptyPlaceholder
            title="No notifications"
            subtitle="You don't have any notifications yet."
          />
        </YStack>
      );
    }

    return null;
  }, [isNotificationsLoading]);

  return (
    <FlashList
      data={notificationItems}
      renderItem={renderListItem}
      keyExtractor={(item) => item.id}
      estimatedItemSize={56}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={GridSuggestions}
      ItemSeparatorComponent={Spacer}
      ListFooterComponentStyle={{
        marginTop: getToken("$2", "space"),
      }}
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

export default Inbox;
