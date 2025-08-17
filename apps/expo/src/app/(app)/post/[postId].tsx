import React, { useRef, useState } from "react";
import { RefreshControl } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { getToken, Spacer, View } from "tamagui";

import PostCard from "~/components/Post/PostCard";
import { Icon } from "~/components/ui";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type Post = RouterOutputs["post"]["paginatePosts"]["items"][number];

interface ViewToken {
  item: Post;
  key: string;
  index: number | null;
  isViewable: boolean;
  timestamp: number;
}

const PostDetail = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const { postId } = useLocalSearchParams<{
    postId: string;
  }>();

  const {
    data: post,
    refetch: refetchPost,
    isLoading: isLoadingPost,
  } = api.post.getPost.useQuery({ postId });

  const {
    data: relatedPosts,
    refetch: refetchRelatedPosts,
    isLoading: isLoadingRelatedPosts,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = api.post.paginatePosts.useInfiniteQuery(
    { userId: post?.authorProfile.userId, pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!post?.authorProfile.userId,
    },
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<string[]>([]);

  // Animation values for shared element transition
  const imageOpacity = useSharedValue(0);
  const imageScale = useSharedValue(0.8);

  React.useEffect(() => {
    if (post) {
      imageOpacity.value = withSpring(1, { duration: 300 });
      imageScale.value = withSpring(1, { duration: 300 });
    }
  }, [post]);

  const animatedImageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
    transform: [{ scale: imageScale.value }],
  }));

  const relatedPostItems =
    relatedPosts?.pages.flatMap((page) => page.items) ?? [];

  // Filter out the current post from related posts
  const filteredRelatedPosts = relatedPostItems.filter(
    (relatedPost) => relatedPost.post.id !== postId,
  );

  const allPosts = post
    ? [post, ...filteredRelatedPosts]
    : filteredRelatedPosts;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchPost(), refetchRelatedPosts()]);
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

  const renderPost = ({ item, index }: { item: Post; index: number }) => (
    <Animated.View style={index === 0 ? animatedImageStyle : undefined}>
      <PostCard {...item} isViewable={viewableItems.includes(item.post.id)} />
    </Animated.View>
  );

  const renderEmptyList = () => {
    if (isLoadingPost || isLoadingRelatedPosts) {
      return (
        <View gap="$4">
          {Array.from({ length: 3 }).map((_, index) => (
            <PostCard.Skeleton key={index} />
          ))}
        </View>
      );
    }

    return null;
  };

  if (isLoadingPost) {
    return (
      <View flex={1} paddingTop={insets.top}>
        <Icon
          name="chevron-back"
          onPress={() => router.back()}
          blurred
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 10,
          }}
        />
        <PostCard.Skeleton />
      </View>
    );
  }

  return (
    <View flex={1}>
      <FlashList
        ref={scrollRef}
        data={allPosts}
        renderItem={renderPost}
        ListEmptyComponent={renderEmptyList}
        keyExtractor={(item) => `post-detail-${item.post.id}`}
        estimatedItemSize={664}
        showsVerticalScrollIndicator={false}
        onEndReached={handleOnEndReached}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
        extraData={viewableItems}
        ItemSeparatorComponent={() => <Spacer size="$4" />}
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
      />

      <Icon
        name="chevron-back"
        onPress={() => router.back()}
        blurred
        style={{
          position: "absolute",
          top: insets.top + 12,
          left: 12,
          zIndex: 10,
        }}
      />
    </View>
  );
};

export default PostDetail;
