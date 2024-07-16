import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions } from "react-native";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { Camera } from "@tamagui/lucide-icons";
import { SizableText, Text, View, YStack } from "tamagui";

import ProfileHeader from "~/components/Hero/Profile/ProfileHeader";
import PostItem from "~/components/Media/PostItem";
import { api } from "~/utils/api";

const { width: screenWidth } = Dimensions.get("window");

interface MediaOfYouProps {
  profileId: string;
}

const MediaOfYou = (props: MediaOfYouProps) => {
  const { profileId: profileIdFromRoute } = props;
  const profileId = parseInt(profileIdFromRoute);

  const [status, setStatus] = useState<"success" | "loading" | "error">(
    "loading",
  );
  const [refreshing, setRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<number[]>([]);

  const {
    data: profileData,
    isLoading: isLoadingProfileData,
    refetch: refetchProfileData,
  } = api.profile.getOtherUserFullProfile.useQuery({
    profileId: profileId,
  });

  const {
    data: recomendationsData,
    isLoading: isLoadingRecomendationsData,
    refetch: refetchRecomendationsData,
  } = api.contacts.getRecommendationProfilesOther.useQuery({
    profileId: profileId,
  });

  const {
    data: friendsData,
    isLoading: isLoadingFriendsData,
    refetch: refetchFriendsData,
  } = api.friend.paginateFriendsOthersByProfileId.useInfiniteQuery(
    { profileId, pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const {
    data: postData,
    isLoading: isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.post.paginatePostsOfUserOther.useInfiniteQuery(
    {
      profileId,
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchProfileData(),
      refetchFriendsData(),
      refetchRecomendationsData(),
    ]);
    setRefreshing(false);
  }, [refetchFriendsData, refetchProfileData, refetchRecomendationsData]);

  const friendItems = useMemo(
    () => friendsData?.pages.flatMap((page) => page.items) ?? [],
    [friendsData],
  );

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
          ListHeaderComponent={() => {
            return (
              <>
                <ProfileHeader
                  isLoadingProfileData={isLoadingProfileData}
                  isLoadingFriendsData={isLoadingFriendsData}
                  isLoadingRecomendationsData={isLoadingRecomendationsData}
                  profileData={profileData}
                  friendsData={friendItems}
                  recomendationsData={recomendationsData}
                />
              </>
            );
          }}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
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
          ListHeaderComponent={() => {
            return (
              <>
                <ProfileHeader
                  isLoadingProfileData={isLoadingProfileData}
                  isLoadingFriendsData={isLoadingFriendsData}
                  isLoadingRecomendationsData={isLoadingRecomendationsData}
                  profileData={profileData}
                  friendsData={friendItems}
                  recomendationsData={recomendationsData}
                />
              </>
            );
          }}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
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

export default MediaOfYou;
