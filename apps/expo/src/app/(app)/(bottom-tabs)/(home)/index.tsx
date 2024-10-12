import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
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
import type { Profile, RecommendationProfile } from "~/hooks/useProfile";
import useProfile from "~/hooks/useProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

const { width: screenWidth } = Dimensions.get("window");

type PostItem = RouterOutputs["post"]["paginatePostsOfRecommended"]["items"][0];

interface TokenItem {
  postId?: string | undefined;
}

const HomeScreen = () => {
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

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
      changed,
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

  /* 
  * ! We need to clear the viewable items when the screen is unfocused on the screen 
  * itself, and cannot just do it in the PostCard component because the PostCard is 
  * unmounted when navigating to another screen and the video shit unmounts before the 
  * useFocusEffect can run 
  */
  useFocusEffect(
    useCallback(() => {
      return () => {
        setViewableItems([]);
      };
    }, [])
  );

  const renderPost = useCallback(
    ({ item }: { item: PostItem }) => {
      if (!profile || !("postId" in item)) return null;

      return (
        <View paddingTop="$4">
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
        </View>
      );
    },
    [profile, viewableItems],
  );

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

    return (
      <View>
        {recommendationsData && recommendationsData.length > 0 && (
          <View paddingTop="$4" paddingHorizontal="$1">
            <PeopleCarousel
              title="Suggestions"
              showMore={recommendationsData.length > 10}
              data={recommendationsData}
              loading={isLoadingRecommendationsData}
              onItemPress={handleProfilePress}
              onShowMore={handleShowMore}
            />
          </View>
        )}
        <Footer />
      </View>
    );
  }, [recommendationsData, isLoadingRecommendationsData, router]);

  const isLoading =
    isLoadingRecommendationsData || isLoadingPostData || isLoadingProfile;

  const listFooterComponent = useCallback(() => {
    if (isLoading) {
      return (
        <YStack gap="$4">
          <PostCard loading />
          <PeopleCarousel loading />
        </YStack>
      );
    }
    if (postItems.length === 0) {
      return <EmptyHomeScreen />;
    }
    return renderFooter();
  }, [isLoading, postItems.length, renderFooter]);

  return (
    <BaseScreenView
      padding={0}
      paddingBottom={0}
      scrollEnabled={postItems.length === 0}
      safeAreaEdges={["top"]}
    >
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
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          numColumns={1}
          keyExtractor={(item) => "home_post_" + item.postId}
          renderItem={renderPost}
          estimatedItemSize={screenWidth}
          ListFooterComponent={listFooterComponent}
          extraData={viewableItems}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
          ItemSeparatorComponent={() => <Spacer size="$4" />}
          ListHeaderComponentStyle={{
            marginBottom: getToken("$4", "space") as number,
          }}
        />
      )}
    </BaseScreenView>
  );
};

const Footer = () => {
  return (
    <YStack
      paddingVertical="$8"
      paddingHorizontal="$4"
      alignItems="center"
      gap="$4"
    >
      <XStack justifyContent="center" alignItems="center">
        <Circle
          size={60}
          backgroundColor="$blue500"
          borderWidth={1}
          borderColor="white"
          overflow="hidden"
        >
          <StyledImage
            source={{ uri: "https://randomuser.me/api/portraits/women/28.jpg" }}
          />
        </Circle>
        <Circle
          size={70}
          backgroundColor="$green500"
          borderWidth={1}
          borderColor="white"
          overflow="hidden"
          zIndex={1}
          marginLeft={-15}
          marginRight={-15}
        >
          <StyledImage
            source={{ uri: "https://randomuser.me/api/portraits/men/1.jpg" }}
          />
        </Circle>
        <Circle
          size={60}
          backgroundColor="$yellow500"
          borderWidth={1}
          borderColor="white"
          overflow="hidden"
        >
          <StyledImage
            source={{ uri: "https://randomuser.me/api/portraits/women/64.jpg" }}
          />
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
          // TODO: share appstore link
          await Sharing.shareAsync("https://oppfy.app", {
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
    <YStack flex={1} justifyContent="space-between">
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
        <H1>Welcome to</H1>
        <Image
          source={Splash}
          contentFit="contain"
          style={{
            width: "100%",
            aspectRatio: 4,
            resizeMode: "contain",
            tintColor: "#F214FF",
          }}
        />
        <SizableText size="$5" fontWeight="bold" textAlign="center">
          Once you follow people, you'll see who gets opped here the moment it
          happens!
        </SizableText>
      </YStack>
      <Footer />
    </YStack>
  );
};

const StyledImage = styled(Image, {
  width: "100%",
  height: "100%",
});

export default HomeScreen;
