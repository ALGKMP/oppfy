/* eslint-disable @typescript-eslint/no-non-null-assertion */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { Camera, Lock } from "@tamagui/lucide-icons";
import { set } from "lodash";
import { SizableText, Text, View, YStack } from "tamagui";

import ProfileHeader from "~/components/Hero/Profile/ProfileHeader";
import PostItem from "~/components/Media/PostItem";
import { api, RouterOutputs } from "~/utils/api";

type ProfileDataSelf = RouterOutputs["profile"]["getFullProfileSelf"];
type profileDataOther = RouterOutputs["profile"]["getFullProfileOther"];

type ProfileData = ProfileDataSelf | profileDataOther;
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
  // refetchProfileData: () => Promise<ProfileData>;
  refetchProfileData: () => Promise<any>;

  recommendations: RecommendationsData; // Replace 'any' with the actual type
  isLoadingRecommendationsData: boolean;
  // refetchRecommendationsData: () => Promise<RecommendationsData>;
  refetchRecommendationsData: () => Promise<any>;

  friends: FriendsData["items"];
  isLoadingFriendsData: boolean;
  // refetchFriendsData: () => Promise<FriendsData>;
  refetchFriendsData: () => Promise<any>;

  posts: PostData["items"];
  isLoadingPostData: boolean;
  isFetchingNextPage: boolean;
  refetchPosts: () => Promise<any>;
  // fetchNextPage: () => Promise<PostData>;
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
    refetchPosts,
    fetchNextPage,
    hasNextPage,
  } = props;

  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<number[]>([]);
  const [isRestricted, setIsRestricted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false); // Blocked by the profile being viewed
  const [hasBlocked, setHasBlocked] = useState(false); // Current user blocked the profile being viewed

  useEffect(() => {
    if (profileData && !isSelfProfile && "networkStatus" in profileData) {
      const privacy = profileData.networkStatus.privacy;
      const canView =
        privacy === "public" ||
        profileData.networkStatus.targetUserFollowState === "Following" ||
        profileData.networkStatus.targetUserFriendState === "Friends";

      const isBlocked = profileData.networkStatus.isTargetUserBlocked;
      const hasBlocked = profileData.networkStatus.isOtherUserBlocked;
      setIsBlocked(isBlocked);
      setHasBlocked(hasBlocked);
      setIsRestricted(!canView);
    }
  }, [profileData, isSelfProfile]);

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchProfileData(),
      refetchFriendsData(),
      refetchRecommendationsData(),
      refetchPosts(),
    ]);
    setRefreshing(false);
  }, [
    refetchFriendsData,
    refetchProfileData,
    refetchRecommendationsData,
    refetchPosts,
  ]);

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

  const onPersonClick = useCallback(
    ({ userId, username }: { userId: string; username: string }) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({
        pathname: "profile/[userId]/",
        params: {
          userId,
          username,
        },
      });
    },
    [router],
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 40,
  };

  const memoizedProfileHeader = useMemo(() => {
    return (
      <ProfileHeader
        navigateToProfile={onPersonClick}
        isSelfProfile={isSelfProfile}
        isLoadingProfileData={isLoadingProfileData}
        isLoadingFriendsData={isLoadingFriendsData}
        isLoadingRecommendationsData={isLoadingRecommendationsData}
        profileData={profileData}
        friendsData={friends}
        isRestricted={isRestricted}
        isBlocked={isBlocked}
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
    isRestricted,
    recommendations,
    isBlocked,
    onPersonClick,
  ]);

  return (
    <View flex={1} width="100%" height="100%">
      <FlashList
        numColumns={1}
        nestedScrollEnabled={true}
        data={isRestricted || isBlocked || hasBlocked ? [] : posts}
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
            <View paddingTop="$4">
              <PostItem
                post={item}
                isSelfPost={isSelfProfile}
                isViewable={viewableItems.includes(item.postId)}
              />
            </View>
          );
        }}
        ListEmptyComponent={() => {
          return (
            <YStack
              flex={1}
              justifyContent="center"
              alignItems="center"
              paddingHorizontal="$8"
              aspectRatio={9 / 6}
            >
              {isRestricted || isBlocked || hasBlocked ? (
                <>
                  <Lock size="$9" color="$gray12" />
                  <SizableText size="$7" fontWeight="bold">
                    This account is private
                  </SizableText>
                  <Text alignContent="center" textAlign="center">
                    Follow or friend this account to see their photos and videos
                  </Text>
                </>
              ) : (
                <>
                  <Camera size="$9" color="$gray12" />
                  <SizableText size="$7" fontWeight="bold">
                    No posts yet
                  </SizableText>
                </>
              )}
            </YStack>
          );
        }}
      />
    </View>
  );
};

export default MediaOfYou;
