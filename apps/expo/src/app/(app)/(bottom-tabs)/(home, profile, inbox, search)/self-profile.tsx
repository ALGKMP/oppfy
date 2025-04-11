import React, { useCallback, useMemo, useRef, useState } from "react";
import { RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { CameraOff } from "@tamagui/lucide-icons";
import { getToken, Spacer, View, YStack } from "tamagui";

import FriendCarousel from "~/components/FriendCarousel";
import PostCard from "~/components/Post/PostCard";
import Header from "~/components/Profile/Header";
import RecommendationCarousel from "~/components/RecommendationCarousel";
import { EmptyPlaceholder, HeaderTitle, Icon } from "~/components/ui";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type Post = RouterOutputs["post"]["paginatePosts"]["items"][number];

const SelfProfile = () => {
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { isFirstInStack } = useLocalSearchParams<{
    isFirstInStack: "yes" | "no";
  }>();

  const {
    data: profileData,
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
  } = api.profile.getProfile.useQuery({});

  const {
    data: profileStats,
    isLoading: isLoadingProfileStats,
    refetch: refetchProfileStats,
  } = api.profile.getProfileStats.useQuery({});

  const {
    data: postsData,
    isLoading: isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchPosts,
    hasNextPage,
  } = api.post.paginatePosts.useInfiniteQuery(
    { pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 40 }),
    [],
  );
  const postItems = useMemo(
    () => postsData?.pages.flatMap((page) => page.items) ?? [],
    [postsData],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchPosts(), refetchProfile()]);
    setIsRefreshing(false);
  }, [refetchPosts, refetchProfile]);

  const handleOnEndReached = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visibleItemIds = viewableItems
        .filter((token) => token.isViewable)
        .map((token) => (token.item as Post).post.id);

      setViewableItems(visibleItemIds);
    },
    [],
  );

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        postId={item.post.id}
        endpoint="self-profile"
        createdAt={item.post.createdAt}
        caption={item.post.caption}
        author={{
          id: item.authorUserId,
          name: item.authorName ?? "",
          username: item.authorUsername ?? "",
          profilePictureUrl: item.authorProfilePictureUrl,
        }}
        recipient={{
          id: item.recipientUserId,
          name: item.recipientName ?? "",
          username: item.recipientUsername,
          profilePictureUrl: item.recipientProfilePictureUrl,
        }}
        media={{
          id: item.post.id,
          type: item.post.mediaType,
          url: item.assetUrl,
          dimensions: {
            width: item.post.width,
            height: item.post.height,
          },
          recipient: {
            id: item.recipientUserId,
            name: item.recipientName ?? "",
            username: item.recipientUsername ?? "",
            profilePictureUrl: item.recipientProfilePictureUrl,
          },
        }}
        stats={{
          likes: item.postStats.likes,
          comments: item.postStats.comments,
          hasLiked: item.hasLiked,
        }}
        isViewable={viewableItems.includes(item.post.id)}
      />
    ),
    [viewableItems],
  );

  const renderEmptyList = useCallback(() => {
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
  }, [isLoadingPostData]);

  const memoizedHeader = useMemo(
    () => (
      <YStack gap="$2" position="relative">
        <Header
          user={{
            name: profileData?.name ?? null,
            username: profileData?.username ?? "",
            profilePictureUrl: profileData?.profilePictureUrl ?? null,
            bio: profileData?.bio ?? null,
          }}
          stats={{
            postCount: profileStats?.posts ?? 0,
            followingCount: profileStats?.following ?? 0,
            followerCount: profileStats?.followers ?? 0,
            friendCount: profileStats?.friends ?? 0,
          }}
          createdAt={profileData?.createdAt}
          isLoading={isLoadingProfile || isLoadingProfileStats}
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
        {isFirstInStack !== "yes" && (
          <Icon
            name="chevron-back"
            onPress={() => router.back()}
            blurred
            style={{
              position: "absolute",
              top: 12,
              left: 12,
            }}
          />
        )}
      </YStack>
    ),
    [
      profileData,
      profileStats,
      isLoadingProfile,
      isLoadingProfileStats,
      isLoadingPostData,
      postItems.length,
      isFirstInStack,
      router,
    ],
  );

  return (
    <FlashList
      ref={scrollRef}
      data={postItems}
      renderItem={renderPost}
      ListHeaderComponent={memoizedHeader}
      ListEmptyComponent={renderEmptyList}
      keyExtractor={(item) => `self-profile-post-${item.post.id}`}
      estimatedItemSize={664}
      showsVerticalScrollIndicator={false}
      onEndReached={handleOnEndReached}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
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
