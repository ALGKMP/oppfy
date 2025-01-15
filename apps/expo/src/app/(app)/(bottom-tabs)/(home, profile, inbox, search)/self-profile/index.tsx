import React, { useLayoutEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { CameraOff, ScrollText, Users } from "@tamagui/lucide-icons";
import { getToken, Spacer, View, YStack } from "tamagui";

import FriendCarousel from "~/components/FriendCarousel";
import PostCard from "~/components/Post/PostCard";
import Header from "~/components/Profile/Header";
import RecommendationCarousel from "~/components/RecommendationCarousel";
import { H5, HeaderTitle, XStack } from "~/components/ui";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import useProfile from "~/hooks/useProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type Post = RouterOutputs["post"]["paginatePostsOfUserSelf"]["items"][number];

const SelfProfile = () => {
  const insets = useSafeAreaInsets();

  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const navigation = useNavigation();
  const { data: profileData } = useProfile();

  const {
    data: postsData,
    isLoading: isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchPosts,
    hasNextPage,
  } = api.post.paginatePostsOfUserSelf.useInfiniteQuery(
    { pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchOnMount: true,
    },
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const postItems = postsData?.pages.flatMap((page) => page.items) ?? [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchPosts();
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
      .map((token) => token.item?.postId)
      .filter((id): id is string => id !== undefined);

    setViewableItems(visibleItemIds);
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 40,
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      postId={item.postId}
      endpoint="self-profile"
      createdAt={item.createdAt}
      caption={item.caption}
      self={{
        id: profileData?.userId ?? "",
        username: profileData?.username ?? "",
        profilePicture: profileData?.profilePictureUrl,
      }}
      author={{
        id: item.authorId,
        username: item.authorUsername ?? "",
        profilePicture: item.authorProfilePicture,
      }}
      recipient={{
        id: item.recipientId,
        username: item.recipientUsername ?? "",
        profilePicture: item.recipientProfilePicture,
      }}
      media={{
        id: item.postId,
        type: item.mediaType,
        url: item.imageUrl,
        isViewable: viewableItems.includes(item.postId),
        dimensions: {
          width: item.width,
          height: item.height,
        },
        recipient: {
          id: item.recipientId,
          username: item.recipientUsername ?? "",
          profilePicture: item.recipientProfilePicture,
        },
      }}
      stats={{
        likes: item.likesCount,
        comments: item.commentsCount,
        hasLiked: item.hasLiked,
      }}
    />
  );

  const renderHeader = () => (
    <YStack gap="$2">
      <Header />
      <YStack>
        {profileData?.friendCount && profileData.friendCount > 0 ? (
          <FriendCarousel paddingHorizontal="$2.5" />
        ) : (
          <RecommendationCarousel paddingHorizontal="$4" />
        )}
      </YStack>
      {(isLoadingPostData || postItems.length > 0) && (
        <HeaderTitle icon={<ScrollText />} paddingHorizontal="$2.5">
          Posts
        </HeaderTitle>
      )}
    </YStack>
  );

  const renderEmptyList = () => {
    if (isLoadingPostData)
      return (
        <YStack gap="$4">
          <PostCard.loading />
        </YStack>
      );
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
      ref={scrollRef}
      data={postItems}
      renderItem={renderPost}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmptyList}
      keyExtractor={(item) => `self-profile-post-${item.postId}`}
      estimatedItemSize={664}
      showsVerticalScrollIndicator={false}
      onEndReached={handleOnEndReached}
      onRefresh={handleRefresh}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      extraData={{ viewableItems, postItems }}
      refreshing={isRefreshing}
      ItemSeparatorComponent={() => <Spacer size="$4" />}
      ListHeaderComponentStyle={{
        marginTop: insets.top,
        marginBottom: getToken("$2", "space") as number,
      }}
    />
  );
};

export default SelfProfile;
