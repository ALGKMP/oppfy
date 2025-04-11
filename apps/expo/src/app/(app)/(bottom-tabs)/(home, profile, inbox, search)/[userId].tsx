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
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
  } = api.profile.getProfile.useQuery({ userId });

  const { data: networkRelationships, refetch: refetchNetworkRelationships } =
    api.profile.getRelationshipStatesBetweenUsers.useQuery({ userId });

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
      refetchNetworkRelationships(),
    ]);
    setIsRefreshing(false);
  }, [refetchPosts, refetchProfile, refetchNetworkRelationships]);

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

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 40 }),
    [],
  );

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
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
    ),
    [viewableItems],
  );

  const memoizedHeader = useMemo(
    () => (
      <YStack gap="$2" position="relative">
        <Header
          user={{
            id: userId,
            name: profileData?.name ?? params.name ?? null,
            username: profileData?.username ?? params.username ?? "",
            profilePictureUrl:
              profileData?.profilePictureUrl ??
              params.profilePictureUrl ??
              null,
            bio: profileData?.bio ?? null,
          }}
          stats={{
            postCount: profileData?.postCount ?? 0,
            followingCount: profileData?.followingCount ?? 0,
            followerCount: profileData?.followerCount ?? 0,
            friendCount: profileData?.friendCount ?? 0,
          }}
          createdAt={profileData?.createdAt}
          isLoading={isLoadingProfile}
          networkRelationships={networkRelationships}
        />
        {isLoadingProfile ? null : (
          <>
            {profileData?.friendCount &&
            profileData.friendCount > 0 &&
            !networkRelationships?.blocked ? (
              <FriendCarousel
                userId={userId}
                username={profileData.username}
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
    ),
    [
      profileData,
      isLoadingProfile,
      isLoadingPostData,
      postItems.length,
      networkRelationships,
      params.name,
      params.username,
      params.profilePictureUrl,
      userId,
      router,
    ],
  );

  const renderNoPosts = useCallback(() => {
    if (isLoadingPostData) {
      return (
        <YStack gap="$4">
          {Array.from({ length: 3 }).map((_, index) => (
            <PostCard.Skeleton key={index} />
          ))}
        </YStack>
      );
    }

    if (networkRelationships?.blocked) {
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

    if (networkRelationships?.privacy === "private") {
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
  }, [isLoadingPostData, networkRelationships]);

  return (
    <FlashList
      data={postItems}
      renderItem={renderPost}
      ListHeaderComponent={memoizedHeader}
      ListEmptyComponent={renderNoPosts}
      keyExtractor={(item) => `other-profile-post-${item.postId}`}
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
