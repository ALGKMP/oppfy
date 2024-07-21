/* eslint-disable @typescript-eslint/no-non-null-assertion */

import React, { useCallback, useMemo, useState } from "react";
import { Dimensions } from "react-native";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { Camera } from "@tamagui/lucide-icons";
import { SizableText, Text, View, YStack } from "tamagui";

import ProfileHeader from "~/components/Hero/Profile/ProfileHeader";
import PostItem from "~/components/Media/PostItem";
import { api } from "~/utils/api";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface MediaOfYouProps {
  profileId?: string; // Optional: if not provided, it's the user's own profile
}

const MediaOfYou = (props: MediaOfYouProps) => {
  const { profileId: profileIdFromRoute } = props;
  const isSelfProfile = !profileIdFromRoute;
  const profileId = isSelfProfile ? undefined : parseInt(profileIdFromRoute);

  const [refreshing, setRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<number[]>([]);

  // Profile data
  const selfProfileQuery = api.profile.getFullProfileSelf.useQuery();
  const otherProfileQuery = api.profile.getFullProfileOther.useQuery(
    { profileId: profileId! },
    { enabled: !isSelfProfile },
  );

  const profileData = isSelfProfile
    ? selfProfileQuery.data
    : otherProfileQuery.data;
  const isLoadingProfileData = isSelfProfile
    ? selfProfileQuery.isLoading
    : otherProfileQuery.isLoading;
  const refetchProfileData = isSelfProfile
    ? selfProfileQuery.refetch
    : otherProfileQuery.refetch;

  // Recommendations data
  const selfRecommendationsQuery =
    api.contacts.getRecommendationProfilesSelf.useQuery();
  const isLoadingRecommendationsData = selfRecommendationsQuery.isLoading;
  const recommendationsData = selfRecommendationsQuery.data;
  const refetchRecommendationsData = selfRecommendationsQuery.refetch;

  // Friends data
  const selfFriendsQuery = api.friend.paginateFriendsSelf.useInfiniteQuery(
    { pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );
  const otherFriendsQuery =
    api.friend.paginateFriendsOthersByProfileId.useInfiniteQuery(
      { profileId: profileId!, pageSize: 10 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: !isSelfProfile,
      },
    );

  const friendsData = isSelfProfile
    ? selfFriendsQuery.data
    : otherFriendsQuery.data;
  const isLoadingFriendsData = isSelfProfile
    ? selfFriendsQuery.isLoading
    : otherFriendsQuery.isLoading;
  const refetchFriendsData = isSelfProfile
    ? selfFriendsQuery.refetch
    : otherFriendsQuery.refetch;

  // Posts data
  const selfPostsQuery = api.post.paginatePostsOfUserSelf.useInfiniteQuery(
    { pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );
  const otherPostsQuery = api.post.paginatePostsOfUserOther.useInfiniteQuery(
    { profileId: profileId!, pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !isSelfProfile,
    },
  );

  const postData = isSelfProfile ? selfPostsQuery.data : otherPostsQuery.data;
  const isLoadingPostData = isSelfProfile
    ? selfPostsQuery.isLoading
    : otherPostsQuery.isLoading;
  const isFetchingNextPage = isSelfProfile
    ? selfPostsQuery.isFetchingNextPage
    : otherPostsQuery.isFetchingNextPage;
  const fetchNextPage = isSelfProfile
    ? selfPostsQuery.fetchNextPage
    : otherPostsQuery.fetchNextPage;
  const hasNextPage = isSelfProfile
    ? selfPostsQuery.hasNextPage
    : otherPostsQuery.hasNextPage;

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      console.log("fetching next page");
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
      refetchRecommendationsData(),
    ]);
    setRefreshing(false);
  }, [refetchFriendsData, refetchProfileData, refetchRecommendationsData]);

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

  const onLoadListener = useCallback(
    ({ elapsedTimeInMs }: { elapsedTimeInMs: number }) => {
      console.log(`FlashList loaded in ${elapsedTimeInMs}ms`);
    },
    [],
  );

  const memoizedProfileHeader = useMemo(() => {
    return (
      <ProfileHeader
        isSelfProfile={isSelfProfile}
        isLoadingProfileData={isLoadingProfileData}
        isLoadingFriendsData={isLoadingFriendsData}
        isLoadingRecommendationsData={isLoadingRecommendationsData}
        profileData={profileData}
        friendsData={friendItems}
        recommendationsData={recommendationsData}
      />
    );
  }, [
    friendItems,
    isLoadingFriendsData,
    isLoadingProfileData,
    isLoadingRecommendationsData,
    isSelfProfile,
    profileData,
    recommendationsData,
  ]);

  return (
    <View flex={1} width="100%" height="100%">
      <FlashList
        onLoad={onLoadListener}
        nestedScrollEnabled={true}
        data={posts}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        numColumns={1}
        onEndReached={handleOnEndReached}
        estimatedItemSize={700}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        extraData={viewableItems}
        keyExtractor={(item) => {
          return item?.postId.toString() ?? "";
        }}
        ListHeaderComponent={memoizedProfileHeader}
        renderItem={({ item }) => {
          if (item === undefined) {
            return null;
          }
          return (
            <PostItem
              post={item}
              isSelfPost={isSelfProfile}
              isViewable={viewableItems.includes(item.postId)}
            />
          );
        }}
        ListEmptyComponent={() => {
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
      />
    </View>
  );
};

export default MediaOfYou;
