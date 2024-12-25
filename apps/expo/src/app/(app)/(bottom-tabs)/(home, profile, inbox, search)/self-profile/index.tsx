import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TouchableOpacity } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { CameraOff, ChevronLeft, MoreHorizontal } from "@tamagui/lucide-icons";
import { getToken, Spacer, View, YStack } from "tamagui";

import FriendCarousel from "~/components/CarouselsNew/FriendCarousel";
import RecommendationCarousel from "~/components/CarouselsNew/RecommendationCarousel";
import PostCard from "~/components/Post/PostCard";
import Header from "~/components/Profile/Header";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import useProfile from "~/hooks/useProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type Post = RouterOutputs["post"]["paginatePostsOfUserSelf"]["items"][number];

const SelfProfile = React.memo(() => {
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const navigation = useNavigation();
  const router = useRouter();

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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchPosts();
    setIsRefreshing(false);
  }, [refetchPosts]);

  const handleOnEndReached = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const postItems = useMemo(
    () => postsData?.pages.flatMap((page) => page.items) ?? [],
    [postsData],
  );

  const isLoading = isLoadingPostData;

  useLayoutEffect(() => {
    navigation.setOptions({
      // title: profileData?.username,
      headerLeft: () => {
        const firstRoute = !router.canDismiss();
        if (firstRoute) return null;

        return (
          <TouchableOpacity
            hitSlop={10}
            onPress={() => {
              if (navigation.canGoBack()) {
                router.back();
              }
            }}
          >
            <ChevronLeft />
          </TouchableOpacity>
        );
      },
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push("/(app)/(settings)")}>
          <MoreHorizontal />
        </TouchableOpacity>
      ),
    });
  }, [navigation, profileData?.username, router]);

  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visibleItemIds = viewableItems
        .filter((token) => token.isViewable)
        .map((token) => token.item?.postId)
        .filter((id): id is string => id !== undefined);

      setViewableItems(visibleItemIds);
    },
    [],
  );

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 40,
    }),
    [],
  );

  const renderPost = useCallback(
    ({ item }: { item: Post }) => {
      return (
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
          }}
        />
      );
    },
    [
      profileData?.profilePictureUrl,
      profileData?.userId,
      profileData?.username,
      viewableItems,
    ],
  );

  const renderHeader = () => (
    <YStack gap="$4">
      <Header />
      {profileData?.friendCount && profileData?.friendCount > 0 ? (
        <FriendCarousel />
      ) : (
        <RecommendationCarousel />
      )}
    </YStack>
  );

  const renderNoPosts = useCallback(
    () => (
      <View paddingTop="$6">
        <EmptyPlaceholder
          icon={<CameraOff size="$10" />}
          title="No posts yet"
        />
      </View>
    ),
    [],
  );

  const listFooterComponent = useCallback(() => {
    if (isLoading) {
      return (
        <YStack gap="$4">
          <PostCard.loading />
          <PostCard.loading />
        </YStack>
      );
    }
    return null;
  }, [isLoading]);

  if (isLoading) {
    return (
      <BaseScreenView padding={0} paddingBottom={0}>
        <YStack gap="$4">
          <PostCard.loading />
        </YStack>
      </BaseScreenView>
    );
  }

  return (
    <>
      <BaseScreenView padding={0} paddingBottom={0} scrollEnabled={false}>
        <FlashList
          ref={scrollRef}
          data={postItems}
          renderItem={renderPost}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderNoPosts}
          ListFooterComponent={listFooterComponent}
          keyExtractor={(item) => `self-profile-post-${item.postId}`}
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
            marginBottom: getToken("$4", "space") as number,
          }}
        />
      </BaseScreenView>
    </>
  );
});

export default SelfProfile;
