import React, { useRef, useState } from "react";
import { RefreshControl } from "react-native";
import { Tabs } from "react-native-collapsible-tab-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScrollToTop } from "@react-navigation/native";
import { CameraOff } from "@tamagui/lucide-icons";
import { Spacer, View, YStack } from "tamagui";

import FriendCarousel from "~/components/FriendCarousel";
import { ProfileTabBar } from "~/components/Layouts/ProfileTabBar";
import PostCard from "~/components/Post/PostCard";
import Header from "~/components/Profile/Header";
import RecommendationCarousel from "~/components/RecommendationCarousel";
import { EmptyPlaceholder } from "~/components/ui";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type Post = RouterOutputs["post"]["paginatePosts"]["items"][number];

interface ViewToken {
  item: Post;
  key: string;
  index: number | null;
  isViewable: boolean;
  timestamp?: number;
}

const SelfProfile = () => {
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const insets = useSafeAreaInsets();
  const {
    data: profile,
    refetch: refetchProfile,
    isLoading: isLoadingProfile,
  } = api.profile.getProfile.useQuery({});

  const {
    data: profileStats,
    refetch: refetchProfileStats,
    isLoading: isLoadingProfileStats,
  } = api.profile.getStats.useQuery({});

  const {
    data: posts,
    refetch: refetchPosts,
    isLoading: isLoadingPostData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = api.post.paginatePosts.useInfiniteQuery(
    { pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const {
    data: postsMadeByUser,
    refetch: refetchPostsMadeByUser,
    isLoading: isLoadingPostsMadeByUserData,
    hasNextPage: hasNextPagePostsMadeByUser,
    fetchNextPage: fetchNextPagePostsMadeByUser,
    isFetchingNextPage: isFetchingNextPagePostsMadeByUser,
  } = api.post.paginatePostsMadeByUser.useInfiniteQuery(
    { pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const isLoading = isLoadingProfile || isLoadingProfileStats;

  const postItems = posts?.pages.flatMap((page) => page.items) ?? [];
  const postsMadeByUserItems =
    postsMadeByUser?.pages.flatMap((page) => page.items) ?? [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchProfile(),
      refetchProfileStats(),
      refetchPosts(),
      refetchPostsMadeByUser(),
    ]);
    setIsRefreshing(false);
  };

  const handleOnEndReached = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  const handleOnEndReachedPostsMadeByUser = async () => {
    if (hasNextPagePostsMadeByUser && !isFetchingNextPagePostsMadeByUser) {
      await fetchNextPagePostsMadeByUser();
    }
  };

  const onViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: ViewToken[];
  }) => {
    const visibleItemIds = viewableItems
      .filter((token) => token.isViewable)
      .map((token) => token.item.post.id);

    setViewableItems(visibleItemIds);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard {...item} isViewable={viewableItems.includes(item.post.id)} />
  );

  const renderPostMadeByUser = ({ item }: { item: Post }) => (
    <PostCard {...item} isViewable={viewableItems.includes(item.post.id)} />
  );

  const renderEmptyList = () => {
    if (isLoadingPostData) {
      return (
        <YStack gap="$4">
          {Array.from({ length: 3 }).map((_, index) => (
            <PostCard.Skeleton key={index} />
          ))}
        </YStack>
      );
    }

    return (
      <View paddingTop="$6">
        <EmptyPlaceholder
          icon={<CameraOff size="$10" />}
          title="No posts yet"
        />
      </View>
    );
  };

  const renderEmptyListPostsMadeByUser = () => {
    if (isLoadingPostsMadeByUserData) {
      return (
        <YStack gap="$4">
          {Array.from({ length: 3 }).map((_, index) => (
            <PostCard.Skeleton key={index} />
          ))}
        </YStack>
      );
    }

    return (
      <View paddingTop="$6">
        <EmptyPlaceholder
          icon={<CameraOff size="$10" />}
          title="No posts made yet"
        />
      </View>
    );
  };

  const renderHeader = () => (
    <YStack
      gap="$2"
      paddingTop={insets.top}
      backgroundColor="$background"
      pointerEvents="box-none"
    >
      <Header
        type="self"
        profile={profile}
        stats={profileStats}
        isLoading={isLoading}
      />

      {/* {isLoadingProfile || isLoadingProfileStats ? null : (
        <>
          {profileStats?.friends && profileStats.friends > 0 ? (
            <FriendCarousel paddingHorizontal="$2.5" />
          ) : (
            <RecommendationCarousel paddingHorizontal="$2.5" />
          )}
        </>
      )} */}
    </YStack>
  );

  return (
    <Tabs.Container
      renderHeader={renderHeader}
      allowHeaderOverscroll={true}
      renderTabBar={(props) => <ProfileTabBar {...props} />}
      headerContainerStyle={{ elevation: 0 }}
      minHeaderHeight={0}
    >
      <Tabs.Tab name="Posts">
        <Tabs.FlashList
          data={postItems}
          renderItem={renderPost}
          ListEmptyComponent={renderEmptyList}
          keyExtractor={(item) => `self-profile-post-${item.post.id}`}
          showsVerticalScrollIndicator={false}
          onEndReached={handleOnEndReached}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
          extraData={viewableItems}
          ItemSeparatorComponent={() => <Spacer size="$4" />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      </Tabs.Tab>
      <Tabs.Tab name="Tagged">
        <Tabs.FlashList
          data={postsMadeByUserItems}
          renderItem={renderPostMadeByUser}
          ListEmptyComponent={renderEmptyListPostsMadeByUser}
          keyExtractor={(item) => `self-profile-post-tagged-${item.post.id}`}
          showsVerticalScrollIndicator={false}
          onEndReached={handleOnEndReachedPostsMadeByUser}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
          extraData={viewableItems}
          ItemSeparatorComponent={() => <Spacer size="$4" />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      </Tabs.Tab>
    </Tabs.Container>
  );
};

export default SelfProfile;
