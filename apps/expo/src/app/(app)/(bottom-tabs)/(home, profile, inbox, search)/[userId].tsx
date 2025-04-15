import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { CameraOff, Lock, UserX } from "@tamagui/lucide-icons";
import { getToken, Spacer, View, YStack } from "tamagui";

import FriendCarousel from "~/components/FriendCarousel";
import PostCard from "~/components/Post/PostCard";
import Header from "~/components/Profile/Header";
import RecommendationCarousel from "~/components/RecommendationCarousel";
import { EmptyPlaceholder, HeaderTitle, Icon } from "~/components/ui";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type Post = RouterOutputs["post"]["paginatePosts"]["items"][number];

const OtherProfile = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    userId: string;
    username?: string;
    name?: string;
    profilePictureUrl?: string;
  }>();

  const { userId } = params;

  const {
    data: profileData,
    refetch: refetchProfile,
    isLoading: isLoadingProfile,
  } = api.profile.getProfile.useQuery({ userId: userId });

  const {
    data: profileStats,
    refetch: refetchProfileStats,
    isLoading: isLoadingProfileStats,
  } = api.profile.getStats.useQuery({ userId });

  const {
    data: relationshipState,
    refetch: refetchRelationshipState,
    isLoading: isLoadingRelationshipStates,
  } = api.profile.getRelationshipStatesBetweenUsers.useQuery({ userId });

  const isLoading =
    isLoadingProfile || isLoadingProfileStats || isLoadingRelationshipStates;

  const {
    data: postsData,
    isLoading: isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchPosts,
    hasNextPage,
  } = api.post.paginatePosts.useInfiniteQuery(
    { userId, pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const postItems = useMemo(
    () => postsData?.pages.flatMap((page) => page.items) ?? [],
    [postsData],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchPosts(),
      refetchProfile(),
      refetchRelationshipState(),
    ]);
    setIsRefreshing(false);
  }, [refetchPosts, refetchProfile, refetchRelationshipState]);

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

  const viewabilityConfig = () => ({ itemVisiblePercentThreshold: 40 });

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      postId={item.post.id}
      endpoint="other-profile"
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
        username: item.recipientUsername ?? "",
        profilePictureUrl: item.recipientProfilePictureUrl,
      }}
      media={{
        id: item.post.id,
        recipient: {
          id: item.post.id,
          name: item.recipientName ?? "",
          username: item.recipientUsername ?? "",
          profilePictureUrl: item.recipientProfilePictureUrl,
        },
        type: item.post.mediaType,
        url: item.assetUrl,
        dimensions: {
          width: item.post.width,
          height: item.post.height,
        },
      }}
      stats={{
        likes: item.postStats.likes,
        comments: item.postStats.comments,
        hasLiked: item.hasLiked,
      }}
      isViewable={viewableItems.includes(item.post.id)}
    />
  );

  const memoizedHeader = () => (
    <YStack gap="$2" position="relative">
      <Header
        type="other"
        profile={profileData}
        stats={profileStats}
        relationshipState={relationshipState}
        isLoading={isLoading}
      />

      {isLoadingProfile ? null : (
        <>
          {profileStats?.friends &&
          profileStats.friends > 0 &&
          !relationshipState?.isBlocked ? (
            <FriendCarousel
              userId={userId}
              username={profileData?.username ?? ""}
              paddingHorizontal="$2.5"
            />
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
    </YStack>
  );

  const renderNoPosts = () => {
    if (isLoadingPostData) {
      return (
        <YStack gap="$4">
          {Array.from({ length: 3 }).map((_, index) => (
            <PostCard.Skeleton key={index} />
          ))}
        </YStack>
      );
    }

    if (relationshipState?.isBlocked) {
      return (
        <View paddingTop="$6">
          <EmptyPlaceholder
            icon={<UserX size="$10" />}
            title="This user has been blocked"
            subtitle="You cannot view their content or interact with them."
          />
        </View>
      );
    }

    if (profileData?.privacy === "private") {
      return (
        <View paddingTop="$6">
          <EmptyPlaceholder
            icon={<Lock size="$10" />}
            title="This account is private"
            subtitle="You need to follow this user to view their posts"
          />
        </View>
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
    <FlashList
      data={postItems}
      renderItem={renderPost}
      ListHeaderComponent={memoizedHeader}
      ListEmptyComponent={renderNoPosts}
      keyExtractor={(item) => `other-profile-post-${item.post.id}`}
      estimatedItemSize={300}
      showsVerticalScrollIndicator={false}
      onEndReached={handleOnEndReached}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      extraData={viewableItems}
      ItemSeparatorComponent={() => <Spacer size="$4" />}
      ListHeaderComponentStyle={{
        marginTop: insets.top,
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

export default OtherProfile;
