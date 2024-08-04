import React, { useLayoutEffect } from "react";
import { TouchableOpacity } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { MoreHorizontal } from "@tamagui/lucide-icons";
import { Text, View, XStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import MediaOfYou from "./MediaOfYou";

const SelfProfile = () => {
  const router = useRouter();
  const navigation = useNavigation();

  const utils = api.useUtils();

  // Profile data query
  // const {
  //   data: profileData,
  //   isLoading: isLoadingProfileData,
  //   refetch: refetchProfileData,
  // } = api.profile.getFullProfileSelf.useQuery();

  const profileData = utils.profile.getFullProfileSelf.getData();

  // Recommendations data query
  const {
    data: recommendationsData,
    isLoading: isLoadingRecommendationsData,
    refetch: refetchRecommendationsData,
  } = api.contacts.getRecommendationProfilesSelf.useQuery();

  // Friends data query
  const {
    data: friendsData,
    isLoading: isLoadingFriendsData,
    refetch: refetchFriendsData,
  } = api.friend.paginateFriendsSelf.useInfiniteQuery(
    { pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  // Posts data query
  const {
    data: postsData,
    isLoading: isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchPosts,
    hasNextPage,
  } = api.post.paginatePostsOfUserSelf.useInfiniteQuery(
    { pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const posts = postsData?.pages.flatMap((page) => page.items) ?? [];
  const friends = friendsData?.pages.flatMap((page) => page.items) ?? [];

  useLayoutEffect(() => {
    navigation.setOptions({
      title: profileData?.username,
    });
  }, [navigation, profileData?.username]);

  return (
    <BaseScreenView padding={0}>
      {
        // MediaOfYou component
        <MediaOfYou
          isSelfProfile={true}
          profileData={profileData}
          isLoadingProfileData={false}
          refetchProfileData={() => utils.profile.getFullProfileSelf.refetch()}
          recommendations={recommendationsData ?? []}
          isLoadingRecommendationsData={isLoadingRecommendationsData}
          refetchRecommendationsData={refetchRecommendationsData}
          friends={friends}
          isLoadingFriendsData={isLoadingFriendsData}
          refetchFriendsData={refetchFriendsData}
          posts={posts}
          isLoadingPostData={isLoadingPostData}
          isFetchingNextPage={isFetchingNextPage}
          refetchPosts={refetchPosts}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage ?? false}
        />
      }
    </BaseScreenView>
  );
};

export default SelfProfile;
