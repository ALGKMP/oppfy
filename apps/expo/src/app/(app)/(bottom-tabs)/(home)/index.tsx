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

import RecommendationCarousel from "~/components/CarouselsNew/RecommendationCarousel";
import PostCard from "~/components/NewPostTesting/PostCard";
import { BaseScreenView } from "~/components/Views";
import useProfile from "~/hooks/useProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

const { width: screenWidth } = Dimensions.get("window");

type PostItem = RouterOutputs["post"]["paginatePostsForFeed"]["items"][0];

interface TokenItem {
  postId?: string | undefined;
}

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

  const onViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken[];
      changed: ViewToken[];
    }) => {
      const visibleItemIds = viewableItems
        .filter((token) => token.isViewable)
        .map((token) => (token.item as TokenItem).postId)
        .filter((id): id is string => id !== undefined);

      console.log("New visible item IDs:", visibleItemIds);
      setViewableItems(visibleItemIds);
    },
    [],
  );

  const renderPost = useCallback(
    ({ item }: { item: PostItem }) => {
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
    [profile, viewableItems],
  );

  const isLoading = isLoadingPostData || isLoadingProfile;

  const renderFooter = useCallback(() => {
    if (isLoading) {
      return (
        <YStack gap="$4">
          <PostCard.loading />
          <PostCard.loading />
        </YStack>
      );
    }

    return (
      <View>
        <View paddingTop="$4" paddingHorizontal="$1">
          <RecommendationCarousel />
          <Footer />
        </View>
      </View>
    );
  }, [isLoading]);

  return (
    <BaseScreenView padding={0} paddingBottom={0}>
      {isLoading ? (
        <YStack
          paddingTop={(insets.top + getToken("$2", "space")) as number}
          gap="$4"
        >
          {Array.from({ length: 3 }).map(() => (
            <PostCard.loading />
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
    <YStack
      paddingVertical="$8"
      paddingHorizontal="$4"
      alignItems="center"
      gap="$4"
    >
      <SizableText size="$5" textAlign="center">
        Invite your friends to use OPPFY with
      </SizableText>
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
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      gap="$3"
    >
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
