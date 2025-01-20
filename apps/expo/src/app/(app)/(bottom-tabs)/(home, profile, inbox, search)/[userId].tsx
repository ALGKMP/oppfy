import React, { useState } from "react";
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
import useProfile from "~/hooks/useProfile";
import useRouteProfile from "~/hooks/useRouteProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type Post = RouterOutputs["post"]["paginatePostsOfUserOther"]["items"][number];

const OtherProfile = () => {
  const router = useRouter();
  const { routeProfile } = useRouteProfile();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    userId: string;
    username?: string;
    name?: string;
    profilePictureUrl?: string;
  }>();

  const { userId } = params;

  console.log("params", params);

  const { data: profileData } = useProfile();

  const { data: networkRelationships, refetch: refetchNetworkRelationships } =
    api.profile.getNetworkRelationships.useQuery({ userId });

  const {
    data: postsData,
    isLoading: isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchPosts,
    hasNextPage,
  } = api.post.paginatePostsOfUserOther.useInfiniteQuery(
    { userId, pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!userId,
      refetchOnMount: true,
    },
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const postItems = postsData?.pages.flatMap((page) => page.items) ?? [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchPosts(), refetchNetworkRelationships()]);
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
      .map((token) => (token.item as Post).postId);

    setViewableItems(visibleItemIds);
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 40,
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      postId={item.postId}
      createdAt={item.createdAt}
      caption={item.caption}
      endpoint="other-profile"
      self={{
        id: profileData?.userId ?? "",
        name: profileData?.name ?? "",
        username: profileData?.username ?? "",
        profilePictureUrl: profileData?.profilePictureUrl,
      }}
      author={{
        id: item.authorId,
        name: item.authorName ?? "",
        username: item.authorUsername ?? "",
        profilePictureUrl: item.authorProfilePicture,
      }}
      recipient={{
        id: item.recipientId,
        name: item.recipientName ?? "",
        username: item.recipientUsername ?? "",
        profilePictureUrl: item.recipientProfilePicture,
      }}
      media={{
        id: item.postId,
        recipient: {
          id: item.recipientId,
          name: item.recipientName ?? "",
          username: item.recipientUsername ?? "",
          profilePictureUrl: item.recipientProfilePicture,
        },
        type: item.mediaType,
        url: item.imageUrl,
        dimensions: {
          width: item.width,
          height: item.height,
        },
      }}
      stats={{
        likes: item.likesCount,
        comments: item.commentsCount,
        hasLiked: item.hasLiked,
      }}
      isViewable={viewableItems.includes(item.postId)}
    />
  );

  const renderHeader = () => (
    <YStack gap="$2" position="relative">
      <Header
        userId={userId}
        name={params.name}
        username={params.username}
        profilePictureUrl={params.profilePictureUrl}
      />
      {profileData?.friendCount &&
      profileData.friendCount > 0 &&
      !networkRelationships?.blocked ? (
        <FriendCarousel userId={userId} paddingHorizontal="$2.5" />
      ) : (
        <RecommendationCarousel paddingHorizontal="$2.5" />
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
  };

  return (
    <FlashList
      data={postItems}
      renderItem={renderPost}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderNoPosts}
      keyExtractor={(item) => `other-profile-post-${item.postId}`}
      estimatedItemSize={300}
      showsVerticalScrollIndicator={false}
      onEndReached={handleOnEndReached}
      onRefresh={handleRefresh}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      extraData={{ viewableItems, postItems }}
      refreshing={isRefreshing}
      ItemSeparatorComponent={() => <Spacer size="$4" />}
      ListHeaderComponentStyle={{
        marginBottom: getToken("$2", "space") as number,
      }}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
};

export default OtherProfile;
