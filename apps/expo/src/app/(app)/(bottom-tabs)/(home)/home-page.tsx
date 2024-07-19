import { useCallback, useMemo, useState } from "react";
import { Dimensions } from "react-native";
import { FlashList, ViewToken } from "@shopify/flash-list";
import { Camera } from "@tamagui/lucide-icons";
import { SizableText, Text, useTheme, View, YStack } from "tamagui";

import RecommendationsCarousel from "~/components/Carousels/RecommendationsCarousel";
import { api } from "~/utils/api";
import PostItem from "../../../../components/Media/PostItem";

const { width: screenWidth } = Dimensions.get("window");

const HomeScreen = () => {
  const [status, setStatus] = useState<"success" | "loading" | "error">(
    "loading",
  );
  const [refreshing, setRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<number[]>([]);

  const {
    data: postData,
    isLoading: isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.post.paginatePostsForFeed.useInfiniteQuery(
    {
      pageSize: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  // Recommendations data
  const selfRecommendationsQuery =
    api.contacts.getRecommendationProfilesSelf.useQuery();
  const isLoadingRecommendationsData = selfRecommendationsQuery.isLoading;
  const recommendationsData = selfRecommendationsQuery.data;
  const refetchRecommendationsData = selfRecommendationsQuery.refetch;

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const posts = useMemo(
    () => postData?.pages.flatMap((page) => page.items),
    [postData],
  );

  /*   const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
    ]);
    setRefreshing(false);
  }, [refetchFriendsData, refetchProfileData, refetchRecomendationsData]); */

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visibleItemIds = viewableItems
        .filter((token) => token.isViewable)
        .map((token) => token.item?.postId)
        .filter((id): id is number => id !== undefined);

      setViewableItems(visibleItemIds);
    },
    [],
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 40,
  };

  return (
    <View flex={1} width="100%" height="100%">
      <FlashList
        nestedScrollEnabled={true}
        data={posts}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        // onRefresh={onRefresh}
        numColumns={1}
        onEndReached={handleOnEndReached}
        keyExtractor={(item) => {
          return "home_" + item?.postId.toString() ?? "home_undefined";
        }}
        renderItem={({ item, index }) => {
          if (item === undefined) {
            return null;
          }
          return (
            <>
              {isLoadingPostData ? (
                <>
                  <Text>Loading...</Text>
                </>
              ) : index == 0 ? (
                <YStack>
                  {isLoadingRecommendationsData ? (
                    <RecommendationsCarousel loading />
                  ) : (
                    recommendationsData && (
                      <RecommendationsCarousel
                        loading={isLoadingRecommendationsData}
                        reccomendationsData={recommendationsData}
                      ></RecommendationsCarousel>
                    )
                  )}
                  <PostItem
                    post={item}
                    isSelfPost={false}
                    isViewable={viewableItems.includes(item.postId)}
                  />
                </YStack>
              ) : (
                <PostItem
                  post={item}
                  isSelfPost={false}
                  isViewable={viewableItems.includes(item.postId)}
                />
              )}
            </>
          );
        }}
        estimatedItemSize={screenWidth}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        extraData={viewableItems}
      />
    </View>
  );
};

export default HomeScreen;
