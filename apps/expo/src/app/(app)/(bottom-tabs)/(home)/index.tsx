import { useCallback, useMemo, useRef, useState } from "react";
import { Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import Person3 from "@assets/girls.jpg";
import Person2 from "@assets/mattandfriends.png";
import Person1 from "@assets/maya.jpg";
import Splash from "@assets/splash.png";
import { useScrollToTop } from "@react-navigation/native";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import {
  Button,
  Circle,
  getToken,
  H1,
  H5,
  SizableText,
  Spacer,
  styled,
  View,
  XStack,
  YStack,
} from "tamagui";

import PeopleCarousel from "~/components/Carousels/PeopleCarousel";
import OtherPost from "~/components/NewPostTesting/OtherPost";
import PostCard from "~/components/NewPostTesting/ui/PostCard";
import { BaseScreenView } from "~/components/Views";
import type { RecommendationProfile } from "~/hooks/useProfile";
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
  const router = useRouter();

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

  const {
    isLoading: isLoadingRecommendationsData,
    data: recommendationsData,
    refetch: refetchRecommendationsData,
  } = api.contacts.getRecommendationProfilesSelf.useQuery();

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
    await Promise.all([refetchRecommendationsData(), refetchPosts()]);
    setRefreshing(false);
  }, [refetchRecommendationsData, refetchPosts]);

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
      if (!profile || !("postId" in item)) return null;

      return (
        <OtherPost
          id={item.postId}
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
            isViewable: viewableItems.includes(item.postId),
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
          }}
        />
      );
    },
    [profile, viewableItems],
  );

  const isLoading =
    isLoadingRecommendationsData || isLoadingPostData || isLoadingProfile;

  const renderFooter = useCallback(() => {
    const handleProfilePress = (profile: RecommendationProfile) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.navigate({
        pathname: "/profile/[userId]",
        params: {
          userId: profile.userId,
          username: profile.username,
        },
      });
    };

    const handleShowMore = () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.navigate({
        pathname: "/(recommended)",
      });
    };

    if (isLoading) {
      return (
        <YStack gap="$4">
          <PostCard loading />
          <PeopleCarousel loading />
        </YStack>
      );
    }

    return (
      <View>
        {recommendationsData && recommendationsData.length > 0 && (
          <View paddingTop="$4" paddingHorizontal="$1">
            <PeopleCarousel
              title="Suggestions 🔥"
              showMore={recommendationsData.length > 10}
              data={recommendationsData}
              loading={isLoadingRecommendationsData}
              onItemPress={handleProfilePress}
              onShowMore={handleShowMore}
            />
            <Footer />
          </View>
        )}
      </View>
    );
  }, [recommendationsData, isLoadingRecommendationsData, router, isLoading]);

  return (
    <BaseScreenView padding={0} paddingBottom={0}>
      <>
        {isLoading ? (
          <>
            <PostCard loading />
            <Spacer size="$4" />
            <PostCard loading />
          </>
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
      </>
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
      <XStack justifyContent="center" alignItems="center">
        <Circle
          size="$7"
          backgroundColor="$blue500"
          borderWidth="$1.5"
          overflow="hidden"
          borderColor="$background"
        >
          <StyledImage source={Person1} />
        </Circle>
        <Circle
          size="$8"
          backgroundColor="$green500"
          borderWidth="$1.5"
          overflow="hidden"
          borderColor="$background"
          zIndex={1}
          marginLeft={-15}
          marginRight={-15}
        >
          <StyledImage source={Person2} />
        </Circle>
        <Circle
          size="$7"
          backgroundColor="$yellow500"
          borderWidth="$1.5"
          overflow="hidden"
          borderColor="$background"
        >
          <StyledImage source={Person3} />
        </Circle>
      </XStack>
      <SizableText size="$5" textAlign="center">
        Invite some friends to use OPPFY with
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
  return (
    <YStack flex={1} justifyContent="space-between" paddingHorizontal="$4">
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
        <H1>Welcome to</H1>
        <Image
          source={Splash}
          contentFit="contain"
          style={{
            width: "100%",
            aspectRatio: 4,
            resizeMode: "contain",
          }}
        />
        <SizableText size="$5" fontWeight="bold" textAlign="center">
          Once you follow people, you'll see who gets opped here the momment it
          happens!
        </SizableText>
      </YStack>
    </YStack>
  );
};

const StyledImage = styled(Image, {
  width: "100%",
  height: "100%",
});

export default HomeScreen;
