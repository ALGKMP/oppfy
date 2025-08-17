import React, { useRef, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import { CameraOff } from "@tamagui/lucide-icons";
import { getToken, Spacer, View, YStack } from "tamagui";

import FriendCarousel from "~/components/FriendCarousel";
import Header from "~/components/Profile/Header";
import { PostGrid } from "~/components/Profile/PostGrid";
import RecommendationCarousel from "~/components/RecommendationCarousel";
import { EmptyPlaceholder, HeaderTitle } from "~/components/ui";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type Post = RouterOutputs["post"]["paginatePosts"]["items"][number];

const SelfProfile = () => {
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);
  const router = useRouter();

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

  const handlePostPress = (post: Post) => {
    router.push(`/post/${post.post.id}`);
  };

  const renderEmptyGrid = () => {
    if (isLoadingPostData) {
      return (
        <YStack gap="$4" paddingHorizontal="$2.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <View
              key={index}
              width="48%"
              aspectRatio={1}
              backgroundColor="$gray3"
              borderRadius="$4"
            />
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

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          progressViewOffset={insets.top}
        />
      }
    >
      {/* Header */}
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

      <Spacer size="$4" />

      {/* Posts Grid */}
      {postItems.length > 0 ? (
        <PostGrid
          posts={postItems}
          onPostPress={handlePostPress}
          paddingHorizontal={getToken("$2.5", "space") as number}
        />
      ) : (
        renderEmptyGrid()
      )}
    </ScrollView>
  );
};

export default SelfProfile;
