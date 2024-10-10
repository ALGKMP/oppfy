import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { UserRoundCheck, UserRoundPlus } from "@tamagui/lucide-icons";
import { Circle, H5, Paragraph, SizableText, XStack, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { VirtualizedListItem } from "~/components/ListItems";
import { Skeleton } from "~/components/Skeletons";
import RecommendationList from "~/components/SpecialLists/RecommendationList";
import { TimeAgo } from "~/components/Texts";
import { BaseScreenView } from "~/components/Views";
import { useSession } from "~/contexts/SessionContext";
import useRouteProfile from "~/hooks/useRouteProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

type NotificationItem =
  RouterOutputs["notifications"]["paginateNotifications"]["items"][0];

const REFETCH_INTERVAL = 1000 * 30;

const Inbox = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { routeProfile } = useRouteProfile();
  const utils = api.useUtils();

  const [refreshing, setRefreshing] = useState(false);

  const {
    data: requestsCount,
    isLoading: isCountRequestsLoading,
    refetch: refetchRequestCount,
  } = api.request.countRequests.useQuery(undefined, {
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });

  const {
    data: recommendationsData,
    isLoading: isRecommendationsLoading,
    refetch: refetchRecommendations,
  } = api.contacts.getRecommendationProfilesSelf.useQuery(undefined, {
    refetchInterval: REFETCH_INTERVAL,
  });

  const {
    data: notificationsData,
    isLoading: isNotificationsLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchNotifications,
  } = api.notifications.paginateNotifications.useInfiniteQuery(
    { pageSize: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: REFETCH_INTERVAL,
    },
  );

  const totalRequestCount =
    (requestsCount?.followRequestCount ?? 0) +
    (requestsCount?.friendRequestCount ?? 0);

  const notificationItems = useMemo(
    () => notificationsData?.pages.flatMap((page) => page.items) ?? [],
    [notificationsData],
  );

  const handleOnEndReached = () => {
    if (!isFetchingNextPage && hasNextPage) {
      void fetchNextPage();
    }
  };

  const followUser = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.notifications.paginateNotifications.cancel();

      // Get the data from the queryCache
      const prevData =
        utils.notifications.paginateNotifications.getInfiniteData({
          pageSize: 20,
        });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.notifications.paginateNotifications.setInfiniteData(
        { pageSize: 20 },
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

      // Return the previous data so we can revert if something goes wrong
      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.notifications.paginateNotifications.setInfiniteData(
        { pageSize: 20 },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.notifications.paginateNotifications.invalidate();
    },
  });

  const onUserSelected = ({ userId, username }: NotificationItem) => {
    routeProfile({ userId, username });
  };

  const onFollowUser = async (userId: string) => {
    await followUser.mutateAsync({ userId });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchNotifications(),
      refetchRequestCount(),
      refetchRecommendations(),
    ]);
    setRefreshing(false);
  }, [refetchNotifications, refetchRequestCount, refetchRecommendations]);

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

  const renderLoadingSkeletons = () => (
    <YStack gap="$4">
      <CardContainer padding="$4">
        <YStack gap="$1">
          <Skeleton width={150} height={30} />
          <Skeleton width="100%" height={20} />
        </YStack>
      </CardContainer>

      <CardContainer>
        {PLACEHOLDER_DATA.map((_, index) => (
          <VirtualizedListItem
            key={index}
            loading
            showSkeletons={{
              imageUrl: true,
              title: true,
              subtitle: true,
              subtitle2: true,
              button: true,
            }}
          />
        ))}
      </CardContainer>
    </YStack>
  );

  const renderFollowRequests = () =>
    totalRequestCount > 0 && (
      <TouchableOpacity onPress={() => router.navigate("/requests")}>
        <CardContainer padding="$4">
          <YStack>
            <SizableText size="$6" fontWeight="bold">
              Follow and Friend Requests
            </SizableText>
            <Paragraph theme="alt1">Approve or ignore these requests</Paragraph>
          </YStack>
          <Circle
            size={totalRequestCount > 99 ? "$2.5" : "$2"}
            backgroundColor="$red9"
            style={styles.countContainer}
          >
            {renderRequestCount()}
          </Circle>
        </CardContainer>
      </TouchableOpacity>
    );

  const renderNotifications = () =>
    notificationItems.length > 0 && (
      <CardContainer>
        <H5 theme="alt1">Notifications</H5>

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
                    icon: <UserRoundPlus size="$1" />,
                    backgroundColor: "#F214FF",
                  };
                case "following":
                  return {
                    text: "Followed",
                    disabled: true,
                    disabledStyle: {
                      opacity: 0.5,
                    },
                    icon: <UserRoundCheck size="$1" />,
                  };
                case "followRequestSent":
                  return {
                    text: "Sent",
                    disabled: true,
                    disabledStyle: {
                      opacity: 0.5,
                    },
                    icon: <UserRoundCheck size="$1" />,
                  };
              }
            })();

            const buttonDisabled =
              item.relationshipState === "following" ||
              item.relationshipState === "followRequestSent";

            return (
              <VirtualizedListItem
                loading={false}
                title={item.username}
                subtitle={item.message}
                subtitle2={
                  <TimeAgo
                    size="$2"
                    date={item.createdAt}
                    format={({ value, unit }) =>
                      `${value}${unit.charAt(0)} ago`
                    }
                  />
                }
                button={{
                  ...buttonProps,
                  disabled: buttonDisabled,
                  disabledStyle: { opacity: 0.5 },
                  onPress: () => void onFollowUser(item.userId),
                }}
                imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
                onPress={() => onUserSelected(item)}
              />
            );
          }}
        />
      </CardContainer>
    );

  if (isCountRequestsLoading || isNotificationsLoading) {
    return (
      <BaseScreenView scrollable>{renderLoadingSkeletons()}</BaseScreenView>
    );
  }

  return (
    <BaseScreenView
      scrollable
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <YStack flex={1} gap="$4" paddingBottom={insets.bottom}>
        {renderFollowRequests()}
        {renderNotifications()}
        {recommendationsData && (
          <RecommendationList
            handleProfileClicked={(userId, username) => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.navigate({
                pathname: "/(inbox)/profile/[userId]",
                params: { userId, username },
              });
            }}
            loading={isRecommendationsLoading}
            recommendationsData={recommendationsData}
          />
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
