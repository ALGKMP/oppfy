import React, { useCallback, useMemo, useRef, useState } from "react";
import { Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import { useScrollToTop } from "@react-navigation/native";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import {
  Button,
  getToken,
  H1,
  H5,
  SizableText,
  Spacer,
  View,
  YStack,
} from "tamagui";

import PostCard from "~/components/Post/PostCard";
import RecommendationCarousel from "~/components/RecommendationCarousel";
import { HeaderTitle } from "~/components/ui";
import { BaseScreenView } from "~/components/Views";
import useProfile from "~/hooks/useProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

const { width: screenWidth } = Dimensions.get("window");

type Post = RouterOutputs["post"]["paginatePostsForFeed"]["items"][0];

const HomeScreen = () => {
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const { profile, isLoading: isLoadingProfile } = useProfile();

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
          self={{
            id: profile.userId,
            username: profile.username,
            profilePicture: profile.profilePictureUrl,
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
            recipient: {
              id: item.recipientId,
              username: item.recipientUsername ?? "",
              profilePicture: item.recipientProfilePicture,
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

    return (
      <YStack paddingHorizontal="$4" gap="$4">
        <RecommendationCarousel />
        <Footer />
      </YStack>
    );
  }, [isLoading]);

  return (
    <BaseScreenView padding={0} paddingBottom={0}>
      {isLoading ? (
        <YStack
          paddingTop={(insets.top + getToken("$2", "space")) as number}
          gap="$4"
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <PostCard.Skeleton key={`loading-post-${index}`} />
          ))}
        </YStack>
      ) : (
        <FlashList
          ref={scrollRef}
          data={postItems}
          refreshing={refreshing}
          onRefresh={onRefresh}
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
          ListEmptyComponent={EmptyHomeScreen}
          contentContainerStyle={{
            paddingTop: (insets.top + getToken("$2", "space")) as number,
          }}
          ListFooterComponentStyle={{
            paddingTop: getToken("$3", "space"),
            paddingBottom: getToken("$4", "space"),
          }}
        />
      )}
    </BaseScreenView>
  );
};

const Footer = () => {
  const getAppStoreLink = () => {
    return `https://apps.apple.com/ca/app/oppfy/id6736484676`;
  };
  return (
    <YStack alignItems="center" gap="$2">
      <HeaderTitle icon="document-text" paddingHorizontal="$2.5">
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
        onPress={async () => {
          const storeLink = getAppStoreLink();
          await Sharing.shareAsync(storeLink, {
            dialogTitle: "Share to...",
          });
        }}
      >
        <H5>✨ Share Invites ✨</H5>
      </Button>
    </YStack>
  );
};

const EmptyHomeScreen = () => {
  const { profile } = useProfile();

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
      <YStack justifyContent="center" alignItems="center">
        <H1 numberOfLines={1} ellipsizeMode="tail" textAlign="center">
          Welcome
        </H1>
        <H1 numberOfLines={1} ellipsizeMode="tail" textAlign="center">
          {profile?.username}!
        </H1>
      </YStack>
      <SizableText size="$5" fontWeight="bold" textAlign="center">
        Start following people to see who gets opped here the moment it happens!
      </SizableText>
    </YStack>
  );
};

export default HomeScreen;
