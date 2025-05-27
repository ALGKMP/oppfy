import React, { useRef, useState } from "react";
import { RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScrollToTop } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { CameraOff } from "@tamagui/lucide-icons";
import { getToken, Spacer, View, YStack } from "tamagui";
import { LegendList } from "@legendapp/list"

import FriendCarousel from "~/components/FriendCarousel";
import PostCard from "~/components/Post/PostCard";
import Header from "~/components/Profile/Header";
import RecommendationCarousel from "~/components/RecommendationCarousel";
import { EmptyPlaceholder, HeaderTitle } from "~/components/ui";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type Post = RouterOutputs["post"]["paginatePosts"]["items"][number];

interface ViewToken {
  item: Post;
  key: string;
  index: number | null;
  isViewable: boolean;
  // timestamp: number;
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

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const isLoading = isLoadingProfile || isLoadingProfileStats;

  const postItems = posts?.pages.flatMap((page) => page.items) ?? [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchProfile(),
      refetchProfileStats(),
      refetchPosts(),
    ]);
    setIsRefreshing(false);
  };

  const handleOnEndReached = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
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

  const renderHeader = () => (
    <YStack gap="$2" position="relative">
      <Header
        type="self"
        profile={profile}
        stats={profileStats}
        isLoading={isLoading}
      />

      {isLoadingProfile || isLoadingProfileStats ? null : (
        <>
          {profileStats?.friends && profileStats.friends > 0 ? (
            <FriendCarousel paddingHorizontal="$2.5" />
          ) : (
            <RecommendationCarousel paddingHorizontal="$2.5" />
          )}
        </>
      )}

      {(isLoadingPostData || postItems.length > 0) && (
        <HeaderTitle icon="document-text" paddingHorizontal="$2.5">
          Posts
        </HeaderTitle>
      )}
    </YStack>
  );

  return (
    <LegendList
      ref={scrollRef}
      data={postItems}
      renderItem={renderPost}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmptyList}
      keyExtractor={(item) => `self-profile-post-${item.post.id}`}
      estimatedItemSize={664}
      showsVerticalScrollIndicator={false}
      onEndReached={handleOnEndReached}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
      extraData={viewableItems}
      ItemSeparatorComponent={() => <Spacer size="$4" />}
      ListHeaderComponentStyle={{
        paddingTop: insets.top,
        marginBottom: getToken("$2", "space") as number,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          progressViewOffset={insets.top}
        />
      }
    />
  );
};

export default SelfProfile;
