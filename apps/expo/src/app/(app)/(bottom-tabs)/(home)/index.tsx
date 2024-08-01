import { useCallback, useMemo, useState } from "react";
import { Dimensions, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { UserRoundPlus } from "@tamagui/lucide-icons";
import {
  Avatar,
  Button,
  Circle,
  Image,
  styled,
  Text,
  XStack,
  YStack,
} from "tamagui";

import PeopleCarousel from "~/components/Carousels/PeopleCarousel";
import RecommendationsCarousel from "~/components/Carousels/RecommendationsCarousel";
import { Skeleton } from "~/components/Skeletons";
import { BaseScreenView } from "~/components/Views";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";
import PostItem from "../../../../components/Media/PostItem";

const { width: screenWidth } = Dimensions.get("window");

const StyledImage = styled(Image, {
  width: "100%",
  height: "100%",
});

const ListFooter = () => {
  return (
    <YStack padding="$5" alignItems="center" space="$4">
      <XStack justifyContent="center" alignItems="center">
        <Circle
          size={60}
          backgroundColor="$blue500"
          borderWidth={1}
          borderColor="white"
          overflow="hidden"
        >
          <StyledImage
            source={{ uri: "https://randomuser.me/api/portraits/men/1.jpg" }}
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
            source={{ uri: "https://randomuser.me/api/portraits/women/1.jpg" }}
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
            source={{ uri: "https://randomuser.me/api/portraits/men/2.jpg" }}
          />
        </Circle>
      </XStack>
      <Text color="white" textAlign="center">
        Invite some friends you want to use Oppfy with
      </Text>
      <Button
        backgroundColor="#F214FF"
        color="white"
        borderRadius={20}
        paddingHorizontal={20}
        pressStyle={{ opacity: 0.8 }}
        onPress={async () => {
          // expo share open app store
          await Sharing.shareAsync("https://google.com", {
            dialogTitle: "Share to...",
          });
        }}
      >
        ✨ Share Invites
      </Button>
    </YStack>
  );
};

const EmptyHomeScreen = () => {
  return (
    <YStack justifyContent="center" alignItems="center" gap="$4" padding="$5">
      <ListFooter></ListFooter>
      <YStack
        alignItems="center"
        gap="$2"
        marginTop="$4"
        paddingHorizontal="$5"
      >
        <Text color="white" fontSize={32} fontWeight="bold">
          Welcome to
        </Text>
        <Text color="white" fontSize={32} fontWeight="bold">
          OPPFY🎉
        </Text>
        <Text color="white" textAlign="center">
          When you follow people, you'll see who gets opped here the second it
          happens!
        </Text>
      </YStack>
    </YStack>
  );
};

interface TokenItem {
  postId?: number | undefined;
}

type PostItem = RouterOutputs["post"]["paginatePostsForFeed"]["items"][0];

const HomeScreen = () => {
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<number[]>([]);

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
      setViewableItems(visibleItemIds);
    },
    [],
  );

  const renderPost = useCallback(
    (item: PostItem) => {
      if (item === undefined) return null;

      return (
        <PostItem
          post={item}
          isSelfPost={false}
          isViewable={viewableItems.includes(item.postId)}
        />
      );
    },
    [viewableItems],
  );

  const renderSuggestions = useMemo(() => {
    if (recommendationsData?.length === 0 || recommendationsData === undefined)
      return null;

    return (
      <PeopleCarousel
        showMore={recommendationsData.length > 10}
        data={recommendationsData}
        loading={isLoadingRecommendationsData}
        onItemPress={(profile) => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.navigate({
            pathname: "/profile/[userId]/",
            params: {
              userId: profile.userId,
              username: profile.username,
            },
          });
        }}
        onShowMore={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.navigate({
            pathname: "/(recommended)",
          });
        }}
        renderExtraItem={() => {
          return (
            <TouchableOpacity onPress={() => console.log("hi")}>
              <YStack marginLeft="$2" gap="$1.5" alignItems="center">
                <Avatar circular size="$6" bordered>
                  <Avatar.Fallback backgroundColor="#F214FF">
                    <XStack
                      flex={1}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <UserRoundPlus
                        marginLeft={4}
                        color="white"
                        backgroundColor="transparent"
                      />
                    </XStack>
                  </Avatar.Fallback>
                </Avatar>
                <Text fontWeight="600" textAlign="center">
                  Invite
                </Text>
              </YStack>
            </TouchableOpacity>
          );
        }}
      />
    );
  }, [recommendationsData, isLoadingRecommendationsData]);

  if (isLoadingRecommendationsData || isLoadingPostData) {
    return (
      <BaseScreenView padding={0} scrollable>
        <YStack gap="$4">
          <RecommendationsCarousel loading />
          {PLACEHOLDER_DATA.map(() => (
            <Skeleton
              radius={16}
              width={screenWidth}
              height={screenWidth * 1.5}
            />
          ))}
        </YStack>
      </BaseScreenView>
    );
  }

  if (recommendationsData?.length === 0 && postItems.length === 0) {
    return <EmptyHomeScreen />;
  }

  return (
    <BaseScreenView padding={0}>
      <FlashList
        nestedScrollEnabled={true}
        data={postItems}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        numColumns={1}
        onEndReached={handleOnEndReached}
        keyExtractor={(item) => "home_" + item?.postId.toString()}
        renderItem={({ item }) => renderPost(item)}
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

export default HomeScreen;
