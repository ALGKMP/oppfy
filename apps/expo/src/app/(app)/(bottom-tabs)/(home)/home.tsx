import { useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import { FlashList, ViewToken } from "@shopify/flash-list";
import { Camera } from "@tamagui/lucide-icons";
import {
  Button,
  Circle,
  Image,
  Separator,
  SizableText,
  styled,
  Text,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";

import RecommendationsCarousel from "~/components/Carousels/RecommendationsCarousel";
import { BaseScreenView } from "~/components/Views";
import useShare from "~/hooks/useShare";
import { api } from "~/utils/api";
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

const HomeScreen = () => {
  const [status, setStatus] = useState<"success" | "loading" | "error">(
    "loading",
  );
  const [refreshing, setRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<number[]>([]);

  const insets = useSafeAreaInsets();

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
    () => postData?.pages.flatMap((page) => page.items).filter(Boolean) || [],
    [postData],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchRecommendationsData, refetchPosts]);
    setRefreshing(false);
  }, [refetchRecommendationsData, refetchPosts]);

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

  return (recommendationsData?.length ?? 0) > 0 || posts.length > 0 ? (
    <View flex={1} width="100%" height="100%">
      {isLoadingPostData ? (
        <YStack gap="$5" padding="$5">
          <Camera size={48} />
          <SizableText size="$3">Loading posts...</SizableText>
        </YStack>
      ) : (
        <FlashList
          nestedScrollEnabled={true}
          data={posts}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          numColumns={1}
          onEndReached={handleOnEndReached}
          keyExtractor={(item) => {
            return "home_" + item?.postId.toString();
          }}
          renderItem={({ item }) => {
            if (item === undefined) {
              return null;
            }
            return (
              <PostItem
                post={item}
                isSelfPost={false}
                isViewable={viewableItems.includes(item.postId)}
              />
            );
          }}
          ListHeaderComponent={
            <>
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
              <Separator />
            </>
          }
          ListFooterComponent={ListFooter}
          estimatedItemSize={screenWidth}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          extraData={viewableItems}
        />
      )}
    </View>
  ) : (
    <EmptyHomeScreen />
  );
};

export default HomeScreen;
