/* eslint-disable @typescript-eslint/no-non-null-assertion */

import React, { useCallback, useMemo, useState } from "react";
import { Dimensions } from "react-native";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { Camera } from "@tamagui/lucide-icons";
import { SizableText, Text, View, YStack } from "tamagui";

import ProfileHeader from "~/components/Hero/Profile/ProfileHeader";
import PostItem from "~/components/Media/PostItem";
import { api, RouterOutputs } from "~/utils/api";

type ProfileData =
  | RouterOutputs["profile"]["getFullProfileSelf"]
  | RouterOutputs["profile"]["getFullProfileOther"];
type RecommendationsData =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"];
type FriendsData = RouterOutputs["friend"]["paginateFriendsSelf"];
// | RouterOutputs["friend"]["paginateFriendsOthersByProfileId"];
type PostData = RouterOutputs["post"]["paginatePostsOfUserSelf"];

interface MediaOfYouProps {
  userId?: string;
  isSelfProfile: boolean;

  profileData: ProfileData | undefined;
  isLoadingProfileData: boolean;
  refetchProfileData: () => Promise<any>;

  recommendations: RecommendationsData;
  isLoadingRecommendationsData: boolean;
  refetchRecommendationsData: () => Promise<any>;

  friends: FriendsData["items"];
  isLoadingFriendsData: boolean;
  refetchFriendsData: () => Promise<any>;

  posts: PostData["items"];
  isLoadingPostData: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<any>;

  hasNextPage: boolean;
}

const MediaOfYou = (props: MediaOfYouProps) => {
  const {
    userId,
    isSelfProfile,

    profileData,
    isLoadingProfileData,
    refetchProfileData,

    recommendations,
    isLoadingRecommendationsData,
    refetchRecommendationsData,

    friends,
    isLoadingFriendsData,
    refetchFriendsData,

    posts,
    isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = props;

  const [refreshing, setRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<number[]>([]);

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      console.log("fetching next page");
      await fetchNextPage();
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchProfileData(),
      refetchFriendsData(),
      refetchRecommendationsData(),
    ]);
    setRefreshing(false);
  }, [refetchFriendsData, refetchProfileData, refetchRecommendationsData]);

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
        friendsData={friends}
        recommendationsData={recommendations}
      />
    );
  }, [
    friends,
    isLoadingFriendsData,
    isLoadingProfileData,
    isLoadingRecommendationsData,
    isSelfProfile,
    profileData,
    recommendations,
  ]);

  return (
    <View flex={1} width="100%" height="100%">
      <FlashList
        numColumns={1}
        onLoad={onLoadListener}
        nestedScrollEnabled={true}
        data={posts}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        onEndReached={handleOnEndReached}
        estimatedItemSize={600}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        extraData={{ viewableItems, posts }}
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
