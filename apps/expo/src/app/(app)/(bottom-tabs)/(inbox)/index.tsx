import React, { useRef, useState } from "react";
import { RefreshControl, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default_profile_picture.jpg";
import { useScrollToTop } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { UserRoundCheck, UserRoundPlus } from "@tamagui/lucide-icons";
import { getToken } from "tamagui";

import GridSuggestions from "~/components/GridSuggestions";
import type { MediaListItemActionProps } from "~/components/ui";
import {
  CardContainer,
  Circle,
  EmptyPlaceholder,
  MediaListItem,
  Paragraph,
  SizableText,
  XStack,
  YStack,
} from "~/components/ui";
import { Spacer } from "~/components/ui/Spacer";
import { TimeAgo } from "~/components/ui/TimeAgo";
import useRouteProfile from "~/hooks/useRouteProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type NotificationItem =
  RouterOutputs["notification"]["paginateNotifications"]["items"][number];

const PAGE_SIZE = 20;

const Inbox = () => {
  const router = useRouter();
  const utils = api.useUtils();
  const { routeProfile } = useRouteProfile();

  const [refreshing, setRefreshing] = useState(false);

  const listRef = useRef<FlashList<NotificationItem>>(null);
  useScrollToTop(listRef);

  utils.notification.unreadNotificationsCount.setData(undefined, 0);

  const { data: stats, refetch: refetchStats } = api.profile.getStats.useQuery(
    {},
  );

  const pendingRequests =
    (stats?.followRequests ?? 0) + (stats?.friendRequests ?? 0);

  const {
    data: notificationsData,
    isLoading: isNotificationsLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchNotifications,
  } = api.notification.paginateNotifications.useInfiniteQuery(
    { pageSize: PAGE_SIZE },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const notificationItems =
    notificationsData?.pages.flatMap((page) => page.items) ?? [];

  const followUser = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      await utils.notification.paginateNotifications.cancel();
      const prevData = utils.notification.paginateNotifications.getInfiniteData(
        {
          pageSize: PAGE_SIZE,
        },
      );
      if (prevData === undefined) return;

      utils.notification.paginateNotifications.setInfiniteData(
        { pageSize: PAGE_SIZE },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.profile.userId === newData.recipientUserId
                ? {
                    ...item,
                    relationshipState:
                      item.profile.privacy === "private"
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
      utils.notification.paginateNotifications.setInfiniteData(
        { pageSize: PAGE_SIZE },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      await utils.notification.paginateNotifications.invalidate();
    },
  });

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchNotifications(), refetchStats()]);
    setRefreshing(false);
  };

  const getNotificationMessage = (item: NotificationItem) => {
    switch (item.notification.eventType) {
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
    if (!item.profile.userId) return undefined;
    switch (item.followStatus) {
      case "NOT_FOLLOWING":
        return {
          label: "Follow",
          icon: UserRoundPlus,
          variant: "primary",
          onPress: () =>
            void followUser.mutateAsync({
              recipientUserId: item.profile.userId,
            }),
        };
      case "FOLLOWING":
        return {
          label: "Followed",
          icon: UserRoundCheck,
          disabled: true,
        };
      case "REQUESTED":
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
      recyclingKey={item.notification.id}
      title={item.profile.username}
      subtitle={getNotificationMessage(item)}
      caption={
        <TimeAgo size="$2" suffix="ago" date={item.notification.createdAt} />
      }
      imageUrl={item.profile.profilePictureUrl ?? DefaultProfilePicture}
      primaryAction={renderActionButton(item)}
      onPress={() =>
        routeProfile(item.profile.userId, {
          name: item.profile.name ?? "",
          username: item.profile.username ?? "",
          profilePictureUrl: item.profile.profilePictureUrl,
        })
      }
    />
  );

  const ListHeaderComponent = () => {
    if (pendingRequests > 0) {
      return (
        <TouchableOpacity
          onPress={() => router.navigate("/requests")}
          style={{ marginBottom: getToken("$4", "space") as number }}
        >
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
        <YStack gap="$2.5">
          {Array.from({ length: 20 }).map((_, index) => (
            <MediaListItem.Skeleton key={index} />
          ))}
        </YStack>
      );
    }

    if (notificationItems.length === 0) {
      return (
        <YStack flex={1} justifyContent="center" padding="$4">
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
      ref={listRef}
      data={notificationItems}
      renderItem={renderListItem}
      keyExtractor={(item) => item.notification.id}
      estimatedItemSize={18}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={GridSuggestions}
      ItemSeparatorComponent={Spacer}
      ListFooterComponentStyle={{
        marginTop: getToken("$2", "space") as number,
      }}
      contentContainerStyle={{
        paddingBottom: getToken("$4", "space") as number,
        paddingHorizontal: getToken("$4", "space") as number,
      }}
      showsVerticalScrollIndicator={false}
      onEndReached={handleOnEndReached}
      onEndReachedThreshold={0.5}
      extraData={notificationItems}
      keyboardShouldPersistTaps="always"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    />
  );
};

export default Inbox;
