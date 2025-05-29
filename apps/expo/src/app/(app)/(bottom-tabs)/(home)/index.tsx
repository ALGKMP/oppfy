import React, { useCallback, useMemo, useRef, useState } from "react";
import { Dimensions, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useScrollToTop } from "@react-navigation/native";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import {
  Button,
  getToken,
  H1,
  H3,
  H5,
  SizableText,
  Spacer,
  XStack,
  YStack,
} from "tamagui";

import PostCard from "~/components/Post/PostCard";
import RecommendationCarousel from "~/components/RecommendationCarousel";
import {
  Avatar,
  CelebrationAnimation,
  HeaderTitle,
  Icon,
  Separator,
} from "~/components/ui";
import { useCelebration } from "~/contexts/CelebrationContext";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

const { width: screenWidth } = Dimensions.get("window");

type Post = RouterOutputs["post"]["paginatePostsForFeed"]["items"][0];

const HomeScreen = () => {
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const router = useRouter();
  const { celebrationData, isVisible, hideCelebration } = useCelebration();

  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const { data: profile, isLoading: isLoadingProfile } =
    api.profile.getProfile.useQuery({});

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
      .map((token) => (token.item as Post).post.id);

    setViewableItems(visibleItemIds);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard {...item} isViewable={viewableItems.includes(item.post.id)} />
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
              {profile?.name}!
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
  }, [isLoading, profile?.name, profile?.profilePictureUrl, router]);

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
    <>
      <FlashList
        ref={scrollRef}
        data={postItems}
        onEndReached={handleOnEndReached}
        nestedScrollEnabled={false}
        showsVerticalScrollIndicator={false}
        numColumns={1}
        keyExtractor={(item) => "home_post_" + item.post.id}
        renderItem={renderPost}
        estimatedItemSize={screenWidth}
        ListFooterComponent={renderFooter}
        extraData={viewableItems}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
        ItemSeparatorComponent={() => <Spacer size="$4" />}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={{
          paddingTop: insets.top,
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

      {/* Celebration Animation */}
      <CelebrationAnimation
        visible={isVisible}
        recipientName={celebrationData?.recipientName ?? ""}
        recipientImage={celebrationData?.recipientImage}
        onComplete={hideCelebration}
      />
    </>
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
