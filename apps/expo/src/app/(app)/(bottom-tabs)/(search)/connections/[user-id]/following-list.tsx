import React, { useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { Send, UserRoundMinus, UserRoundPlus } from "@tamagui/lucide-icons";
import { Separator, SizableText, View } from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import { ButtonProps } from "~/components/ListItems/VirtualizedListItem";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

interface UserItem {
  userId: string;
  username: string;
  name: string;
  profilePictureUrl: string;
  isFollowing: boolean;
  privacy: "public" | "private";
}

const Following = () => {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const headerHeight = useHeaderHeight();

  const utils = api.useUtils();

  const follow = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.follow.paginateFollowingOthers.cancel();

      // Get the data from the queryCache
      const prevData = utils.follow.paginateFollowingOthers.getInfiniteData({
        userId: newData.userId,
      });
      console.log("FOLLOW: " + prevData);
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.follow.paginateFollowingOthers.setInfiniteData(
        { userId: newData.userId },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.userId === newData.userId
                ? { ...item, isFollowing: true }
                : item,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, newData, ctx) => {
      if (ctx === undefined) return;
      utils.follow.paginateFollowingOthers.setInfiniteData(
        { userId: newData.userId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.follow.paginateFollowingOthers.invalidate();
    },
  });

  const unfollow = api.follow.unfollowUser.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.follow.paginateFollowingOthers.cancel();

      // Get the data from the queryCache
      const prevData = utils.follow.paginateFollowingOthers.getInfiniteData({
        userId: newData.userId,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.follow.paginateFollowingOthers.setInfiniteData(
        { userId: newData.userId },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.userId === newData.userId
                ? { ...item, isFollowing: false }
                : item,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, newData, ctx) => {
      if (ctx === undefined) return;
      utils.follow.paginateFollowingOthers.setInfiniteData(
        { userId: newData.userId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.follow.paginateFollowingOthers.invalidate();
    },
  });

  const cancelFollowRequest = api.follow.cancelFollowRequest.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.follow.paginateFollowingOthers.cancel();

      // Get the data from the queryCache
      const prevData = utils.follow.paginateFollowingOthers.getInfiniteData({
        userId: newData.userId,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.follow.paginateFollowingOthers.setInfiniteData(
        { userId: newData.userId },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.userId === newData.userId
                ? { ...item, isFollowing: false }
                : item,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, newData, ctx) => {
      if (ctx === undefined) return;
      utils.follow.paginateFollowingOthers.setInfiniteData(
        { userId: newData.userId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.follow.paginateFollowingOthers.invalidate();
    },
  });

  const {
    data: followingData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.follow.paginateFollowingOthers.useInfiniteQuery(
    { userId, pageSize: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const followingItems = useMemo(
    () => followingData?.pages.flatMap((page) => page.items) ?? [],
    [followingData],
  );

  const itemCount = useMemo(
    () =>
      followingData?.pages.reduce(
        (total, page) => total + page.items.length,
        0,
      ) ?? 0,
    [followingData],
  );

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const handleFollow = async (userId: string) => {
    await follow.mutateAsync({ userId });
  };

  const handleUnfollow = async (userId: string) => {
    await unfollow.mutateAsync({ userId });
  };

  const handleCancelFollowRequest = async (userId: string) => {
    await cancelFollowRequest.mutateAsync({ userId });
  };

  const renderButton = (item: UserItem): ButtonProps => {
    if (item.privacy === "private" && !item.isFollowing) {
      return {
        text: "Sent",
        icon: Send,
        onPress: () => void handleCancelFollowRequest(item.userId),
      };
    } else if (item.isFollowing) {
      return {
        text: "Unfollow",
        icon: UserRoundMinus,
        onPress: () => void handleUnfollow(item.userId),
      };
    } else {
      return {
        text: "Follow",
        icon: UserRoundPlus,
        onPress: () => void handleFollow(item.userId),
      };
    }
  };

  const renderListItem = ({ item }: { item: UserItem }) => (
    <View>
      <VirtualizedListItem
        loading={false}
        title={item.username}
        subtitle={item.name}
        imageUrl={item.profilePictureUrl}
        button={renderButton(item)}
        onPress={() =>
          // @ts-expect-error: Experimental typed routes dont support layouts yet
          router.push({
            pathname: "/profile/[profile-id]",
            params: { profileId: String(item.userId) },
          })
        }
      />
    </View>
  );

  if (isLoading) {
    return (
      <BaseScreenView paddingBottom={0}>
        <FlashList
          data={PLACEHOLDER_DATA}
          ItemSeparatorComponent={Separator}
          estimatedItemSize={75}
          renderItem={() => (
            <VirtualizedListItem
              loading
              showSkeletons={{
                imageUrl: true,
                title: true,
                subtitle: true,
                button: true,
              }}
            />
          )}
        />
      </BaseScreenView>
    );
  }

  if (itemCount === 0) {
    return (
      <BaseScreenView>
        <View flex={1} justifyContent="center" bottom={headerHeight}>
          <EmptyPlaceholder
            title="Following"
            subtitle="Once you follow someone, you'll see them here."
            icon={<UserRoundPlus />}
          />
        </View>
      </BaseScreenView>
    );
  }

  return (
    <BaseScreenView paddingBottom={0}>
      <FlashList
        onRefresh={refetch}
        refreshing={isLoading}
        data={followingItems}
        ItemSeparatorComponent={Separator}
        estimatedItemSize={75}
        onEndReached={handleOnEndReached}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <SizableText size="$2" theme="alt1" marginBottom="$2">
            FOLLOWERS
          </SizableText>
        }
        renderItem={renderListItem}
      />
    </BaseScreenView>
  );
};

export default Following;
