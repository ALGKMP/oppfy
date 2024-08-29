import { useCallback, useMemo, useState } from "react";
import { Dimensions, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import Splash from "@assets/splash.png";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { UserRoundPlus } from "@tamagui/lucide-icons";
import {
  Button,
  Circle,
  H1,
  H5,
  SizableText,
  styled,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import PeopleCarousel from "~/components/Carousels/PeopleCarousel";
import CardContainer from "~/components/Containers/CardContainer";
import OtherPost from "~/components/NewPostTesting/OtherPost";
import { Skeleton } from "~/components/Skeletons";
import { BaseScreenView } from "~/components/Views";
import type { Profile, RecommendationProfile } from "~/hooks/useProfile";
import useProfile from "~/hooks/useProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";
import PostItem from "../../../../components/Media/PostItem";

const { width: screenWidth } = Dimensions.get("window");

type PostItem = RouterOutputs["post"]["paginatePostsForFeed"]["items"][0];

interface TokenItem {
  postId?: string | undefined;
}

const HomeScreen = () => {
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
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visibleItemIds = viewableItems
        .filter((token) => token.isViewable)
        .map((token) => (token.item as TokenItem).postId)
        .filter((id) => id !== undefined);
      setViewableItems(visibleItemIds as string[]);
    },
    [],
  );

  const renderPost = useCallback(
    (item: PostItem, profile: Profile) => {
      if (item.authorUsername === null) return null;
      if (item.recipientUsername === null) return null;

      return (
        <View paddingTop="$4">
          <YStack gap="$4">
            <PostItem
              post={item}
              isSelfPost={false}
              isViewable={viewableItems.includes(item.postId)}
            />
            <OtherPost
              id={item.postId}
              createdAt={item.createdAt}
              caption={item.caption}
              self={{
                id: profile.userId,
                username: profile.username,
                profilePicture: profile.profilePictureUrl,
              }}
              author={{
                id: item.authorId,
                username: item.authorUsername,
              }}
              recipient={{
                id: item.recipientId,
                username: item.recipientUsername,
                profilePicture: item.recipientProfilePicture,
              }}
              media={{
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
          </YStack>
        </View>
      );
    },
    [viewableItems],
  );

  const renderSuggestions = useMemo(() => {
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

    if (recommendationsData === undefined || recommendationsData.length === 0)
      return null;

    return (
      <View paddingTop="$4" paddingHorizontal="$1">
        <PeopleCarousel
          title="Suggestions"
          showMore={recommendationsData.length > 10}
          data={recommendationsData}
          loading={isLoadingRecommendationsData}
          onItemPress={handleProfilePress}
          onShowMore={handleShowMore}
          renderExtraItem={() => {
            return (
              <TouchableOpacity onPress={() => console.log("hi")}>
                <YStack marginLeft="$2" gap="$1.5" alignItems="center">
                  <Circle size={70} backgroundColor="#F214FF">
                    <UserRoundPlus size="$3" marginLeft={3} color="white" />
                  </Circle>

                  <Text textAlign="center" fontWeight="600" theme="alt1">
                    Invite
                  </Text>
                </YStack>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  }, [recommendationsData, isLoadingRecommendationsData, router]);

  if (isLoadingRecommendationsData || isLoadingPostData || isLoadingProfile) {
    return (
      <BaseScreenView paddingHorizontal={0} paddingBottom={0} scrollable>
        <YStack gap="$4">
          {PLACEHOLDER_DATA.map(() => (
            <CardContainer padding={0}>
              <YStack>
                <XStack padding="$2" gap="$2">
                  <Skeleton circular size={46} />
                  <YStack justifyContent="center" gap>
                    <Skeleton width={60} height={16} />
                    <Skeleton width={120} height={16} />
                  </YStack>
                </XStack>

                <Skeleton radius={16} width="100%" height={screenWidth * 1.5} />
              </YStack>
            </CardContainer>
          ))}
        </YStack>
      </BaseScreenView>
    );
  }

  if (
    profile === undefined ||
    (recommendationsData?.length === 0 && postItems.length === 0)
  ) {
    return (
      <BaseScreenView>
        <EmptyHomeScreen />
      </BaseScreenView>
    );
  }

  return (
    // ! dont remove the paddingBottom 0, it actually does something
    <BaseScreenView padding={0} paddingBottom={0}>
      <FlashList
        data={postItems}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={handleOnEndReached}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
        numColumns={1}
        keyExtractor={(item) => "home_" + item.postId.toString()}
        renderItem={({ item }) => renderPost(item, profile)}
        ListHeaderComponent={renderSuggestions}
        ListFooterComponent={ListFooter}
        estimatedItemSize={screenWidth}
        extraData={viewableItems}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
      />
    </BaseScreenView>
  );
};

const ListFooter = () => {
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
          // expo share open app store
          await Sharing.shareAsync("https://google.com", {
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
      <ListFooter />
    </YStack>
  );
};

const StyledImage = styled(Image, {
  width: "100%",
  height: "100%",
});

export default HomeScreen;
