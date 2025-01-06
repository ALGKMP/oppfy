import React, { useRef, useState } from "react";
import { RefreshControl, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { UserRoundCheck, UserRoundPlus } from "@tamagui/lucide-icons";
import { getToken } from "tamagui";

import GridSuggestions from "~/components/GridSuggestions";
import {
  CardContainer,
  Circle,
  H5,
  MediaListItem,
  MediaListItemActionProps,
  MediaListItemSkeleton,
  Paragraph,
  SizableText,
  XStack,
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

  const notificationItems =
    notificationsData?.pages.flatMap((page) => page.items) ?? [];

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

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchNotifications(), refetchRequestCount()]);
    setRefreshing(false);
  };

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

  const renderListItem = ({ item }: { item: NotificationItem }) => (
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
  );

  const ListHeaderComponent = () => {
    const pendingRequests =
      (requestsCount?.followRequestCount ?? 0) +
      (requestsCount?.friendRequestCount ?? 0);

    if (pendingRequests > 0) {
      return (
        <TouchableOpacity onPress={() => router.navigate("/requests")}>
          <CardContainer
            padding="$4"
            orientation="horizontal"
            alignItems="center"
            justifyContent="space-between"
          >
            <YStack>
              <SizableText size="$6" fontWeight="bold">
                Follow and Friend Requests
              </SizableText>
              <Paragraph theme="alt1">
                Approve or ignore these requests
              </Paragraph>
            </YStack>

            <Circle size="$2.5" backgroundColor="$red9">
              {pendingRequests > 99 ? (
                <XStack>
                  <SizableText size="$4" color="white" fontWeight="bold">
                    99
                  </SizableText>
                  <SizableText size="$2">+</SizableText>
                </XStack>
              ) : (
                <SizableText size="$4" color="white" fontWeight="bold">
                  {pendingRequests}
                </SizableText>
              )}
            </Circle>
          </CardContainer>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const ListEmptyComponent = () => {
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
  };

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
      ListHeaderComponentStyle={{
        paddingBottom: getToken("$4", "space"),
      }}
      ListFooterComponentStyle={{
        marginTop: getToken("$2", "space"),
      }}
      contentContainerStyle={{
        paddingBottom: getToken("$4", "space"),
        paddingHorizontal: getToken("$4", "space"),
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
