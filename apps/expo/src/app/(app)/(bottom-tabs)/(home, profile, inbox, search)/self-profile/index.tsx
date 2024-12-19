import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { useNavigation, useRouter } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { CameraOff, ChevronLeft, MoreHorizontal } from "@tamagui/lucide-icons";
import { getToken, Spacer, View, YStack } from "tamagui";

import SelfPost from "~/components/NewPostTesting/SelfPost";
import PostCard from "~/components/NewPostTesting/ui/PostCard";
import Header from "~/components/NewProfileTesting/Header";
import EmptyPlaceholder from "~/components/UIPlaceholders/EmptyPlaceholder";
import { BaseScreenView } from "~/components/Views";
import useProfile from "~/hooks/useProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import FriendCarousel from "~/components/CarouselsNew/FriendCarousel";
import RecommendationCarousel from "~/components/CarouselsNew/RecommendationCarousel";

type Post = RouterOutputs["post"]["paginatePostsOfUserSelf"]["items"][number];

const SelfProfile = React.memo(() => {
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const navigation = useNavigation();
  const router = useRouter();

  const {
    profile: profileData,
    isLoading: isLoadingProfileData,
    refetch: refetchProfile,
  } = useProfile();

  const {
    data: recommendationsData,
    isLoading: isLoadingRecommendationsData,
    refetch: refetchRecommendations,
  } = api.contacts.getRecommendationProfilesSelf.useQuery();

  const {
    data: friendsData,
    isLoading: isLoadingFriendsData,
    refetch: refetchFriends,
  } = api.friend.paginateFriendsSelf.useInfiniteQuery(
    { pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const {
    data: postsData,
    isLoading: isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchPosts,
    hasNextPage,
  } = api.post.paginatePostsOfUserSelf.useInfiniteQuery(
    { pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchProfile(),
      refetchRecommendations(),
      refetchFriends(),
      refetchPosts(),
    ]);
    setIsRefreshing(false);
  }, [refetchProfile, refetchRecommendations, refetchFriends, refetchPosts]);

  const handleOnEndReached = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const postItems = useMemo(
    () => postsData?.pages.flatMap((page) => page.items) ?? [],
    [postsData],
  );

  const friendItems = useMemo(
    () => friendsData?.pages.flatMap((page) => page.items) ?? [],
    [friendsData],
  );

  const recommendationItems = useMemo(
    () => recommendationsData ?? [],
    [recommendationsData],
  );

  const isLoading =
    isLoadingProfileData ||
    isLoadingFriendsData ||
    isLoadingRecommendationsData ||
    isLoadingPostData;

  const navigateToProfile = useCallback(
    ({ userId, username }: { userId: string; username: string }) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({
        pathname: "/profile/[userId]",
        params: { userId, username },
      });
    },
    [router],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: profileData?.username,
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

  const renderPost = useCallback(
    ({ item }: { item: Post }) => {
      return (
        <SelfPost
          id={item.postId}
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
            type: item.mediaType,
            url: item.imageUrl,
            isViewable: viewableItems.includes(item.postId),
            dimensions: {
              width: item.width,
              height: item.height,
            },
          }}
          stats={{
            likes: item.likesCount,
            comments: item.commentsCount,
          }}
        />
      );
    },
    [profileData, viewableItems],
  );

  const renderHeader = 
    () => (
      <YStack gap="$4">
        <Header />
        {friendItems.length > 0 ? (
          <FriendCarousel />
        ) : (
          <RecommendationCarousel />
        )}
      </YStack>
    )

  const renderEmptyState = useCallback(
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

  if (isLoading) {
    return (
      <BaseScreenView padding={0} paddingBottom={0}>
        <YStack gap="$4">
          <PostCard loading />
        </YStack>
      </BaseScreenView>
    );
  }

  return (
    <BaseScreenView padding={0} paddingBottom={0}>
      <FlashList
        ref={scrollRef}
        data={postItems}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        keyExtractor={(item) => `self-profile-post-${item.postId}`}
        estimatedItemSize={600}
        showsVerticalScrollIndicator={false}
        onEndReached={handleOnEndReached}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
        extraData={viewableItems}
        ItemSeparatorComponent={() => <Spacer size="$4" />}
        ListHeaderComponentStyle={{
          marginBottom: getToken("$4", "space") as number,
        }}
        ListEmptyComponent={renderEmptyState}
      />
    </BaseScreenView>
  );
});

export default SelfProfile;
