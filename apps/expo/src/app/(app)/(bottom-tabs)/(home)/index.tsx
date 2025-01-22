import React, { useCallback, useMemo, useRef, useState } from "react";
import { Dimensions, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import LogoText from "@assets/splash.png";
import { useScrollToTop } from "@react-navigation/native";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { ArrowRight, Sparkles, Users } from "@tamagui/lucide-icons";
import {
  Button,
  getToken,
  H1,
  H3,
  H5,
  SizableText,
  Spacer,
  View,
  XStack,
  YStack,
} from "tamagui";

import PostCard from "~/components/Post/PostCard";
import RecommendationCarousel from "~/components/RecommendationCarousel";
import { Avatar, HeaderTitle, Icon, Separator } from "~/components/ui";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

const { width: screenWidth } = Dimensions.get("window");

type Post = RouterOutputs["post"]["paginatePostsForFeed"]["items"][0];

const HomeScreen = () => {
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);
  const router = useRouter();

  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const { data: profile, isLoading: isLoadingProfile } =
    api.profile.getFullProfileSelf.useQuery();

  const {
    data: postData,
    isLoading: isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchPosts,
  } = api.post.paginatePostsForFeed.useInfiniteQuery(
    {
      pageSize: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const postItems = useMemo(
    () => postData?.pages.flatMap((page) => page.items).filter(Boolean) ?? [],
    [postData],
  );

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchPosts()]);
    setRefreshing(false);
  }, [refetchPosts]);

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

  const renderPost = useCallback(
    ({ item }: { item: Post }) => {
      if (profile === undefined) return null;

      return (
        <PostCard
          postId={item.postId}
          createdAt={item.createdAt}
          caption={item.caption}
          endpoint="home-feed"
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
    },
    [profile, viewableItems],
  );

  const isLoading = isLoadingPostData || isLoadingProfile;

  const renderEmptyList = useCallback(() => {
    if (isLoading) {
      return (
        <YStack gap="$4">
          {Array.from({ length: 5 }).map((_, index) => (
            <PostCard.Skeleton key={`loading-post-${index}`} />
          ))}
        </YStack>
      );
    }

    return (
      <YStack flex={1} height="100%" paddingHorizontal="$4" paddingTop="$6">
        <YStack alignItems="center" gap="$4">
          {/* Welcome Section */}
          <YStack alignItems="center" gap="$2" marginBottom="$2">
            <Avatar size={110} source={profile?.profilePictureUrl} bordered />
            <H1 color="$gray12" textAlign="center" letterSpacing={1} size="$9">
              Welcome to OPPFY
            </H1>
            <H3 color="$gray11" textAlign="center" fontWeight="400" size="$6">
              {profile?.username}!
            </H3>
          </YStack>

          {/* Action Cards */}
          <YStack gap="$3" width="100%" maxWidth={400}>
            <XStack
              backgroundColor="$gray3"
              padding="$3.5"
              paddingRight="$5"
              borderRadius="$6"
              alignItems="center"
              gap="$3"
              pressStyle={{ opacity: 0.8 }}
              onPress={() => router.push("/(app)/(recommendations)")}
            >
              {/* <Users size={24} color={getToken("$gray11", "color") as string} /> */}
              <Icon name="people" />
              <YStack flex={1}>
                <H5 color="$gray12">Find Your Friends</H5>
                <SizableText color="$gray11" size="$3">
                  Connect with friends to see their moments
                </SizableText>
              </YStack>
              <Icon name="arrow-forward" size={14} />
            </XStack>

            <XStack
              backgroundColor="$gray3"
              padding="$3.5"
              paddingRight="$5"
              borderRadius="$6"
              alignItems="center"
              gap="$3"
              pressStyle={{ opacity: 0.8 }}
              onPress={() => router.push("/(app)/(bottom-tabs)/(camera)")}
            >
              <Icon name="sparkles" />
              <YStack flex={1}>
                <H5 color="$gray12">Share Your First Moment</H5>
                <SizableText color="$gray11" size="$3">
                  Create your first post to get started
                </SizableText>
              </YStack>
              <Icon name="arrow-forward" size={14} />
            </XStack>
          </YStack>

          <Separator width="100%" />
        </YStack>
      </YStack>
    );
  }, [isLoading, profile?.profilePictureUrl, profile?.username, router]);

  const renderFooter = useCallback(() => {
    if (isLoading) {
      return (
        <YStack gap="$4">
          {Array.from({ length: 3 }).map((_, index) => (
            <PostCard.Skeleton key={index} />
          ))}
        </YStack>
      );
    }

    // we should not show the footer if there are more posts to fetch
    if (hasNextPage) {
      return null;
    }

    return (
      <YStack gap="$4">
        <RecommendationCarousel paddingHorizontal="$4" />
        <Footer />
      </YStack>
    );
  }, [hasNextPage, isLoading]);

  return (
    <FlashList
      ref={scrollRef}
      data={postItems}
      onEndReached={handleOnEndReached}
      nestedScrollEnabled={false}
      showsVerticalScrollIndicator={false}
      numColumns={1}
      keyExtractor={(item) => "home_post_" + item.postId}
      renderItem={renderPost}
      estimatedItemSize={screenWidth}
      ListFooterComponent={renderFooter}
      extraData={viewableItems}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
      ItemSeparatorComponent={() => <Spacer size="$4" />}
      ListEmptyComponent={renderEmptyList}
      contentContainerStyle={{
        paddingTop: (insets.top + getToken("$2", "space")) as number,
      }}
      ListFooterComponentStyle={{
        paddingTop: getToken("$3", "space") as number,
        paddingBottom: getToken("$4", "space") as number,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          progressViewOffset={insets.top}
        />
      }
    />
  );
};

const Footer = () => (
  <YStack alignItems="center" gap="$2">
    <HeaderTitle icon="rocket" iconAfter="rocket" paddingHorizontal="$2.5">
      Grow Your OPPFY Community
    </HeaderTitle>
    <Button
      borderRadius="$8"
      backgroundColor="#F214FF"
      pressStyle={{
        opacity: 0.8,
        borderWidth: 0,
        backgroundColor: "#F214FF",
      }}
      onPress={() => Sharing.shareAsync("https://www.oppfy.app")}
    >
      <H5>✨ Share Invites ✨</H5>
    </Button>
  </YStack>
);

export default HomeScreen;
