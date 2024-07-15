import { useCallback, useMemo, useState } from "react";
import { Dimensions } from "react-native";
import { FlashList, ViewToken } from "@shopify/flash-list";
import { Camera } from "@tamagui/lucide-icons";
import { SizableText, Text, useTheme, View, YStack } from "tamagui";

import { api } from "~/utils/api";
import PostItem from "../(profile)/self-profile/PostItem";

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
      {posts?.length ? (
        <FlashList
          nestedScrollEnabled={true}
          data={posts}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          // onRefresh={onRefresh}
          numColumns={1}
          onEndReached={handleOnEndReached}
          keyExtractor={(item) => {
            return item?.postId.toString() ?? "";
          }}
          renderItem={({ item }) => {
            if (item === undefined) {
              return null;
            }
            return (
              <>
                {isLoadingPostData ? (
                  <>
                    <Text>Loading...</Text>
                  </>
                ) : (
                  <PostItem
                    post={item}
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
      ) : (
        <FlashList
          nestedScrollEnabled={true}
          data={[1]}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          // onRefresh={onRefresh}
          numColumns={1}
          // keyExtractor={(item) => {item.toString();
          // }}
          renderItem={() => {
            return (
              <YStack
                flex={1}
                justifyContent="center"
                alignItems="center"
                aspectRatio={9 / 6}
              >
                <Camera size="$9" color="$gray12" />
                <SizableText size="$8">No posts yet</SizableText>
              </YStack>
            );
          }}
          estimatedItemSize={screenWidth}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          extraData={viewableItems}
        />
      )}
    </View>
  );
};

export default HomeScreen;
