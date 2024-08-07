import React, { useLayoutEffect } from "react";
import { useNavigation } from "expo-router";

import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import MediaOfYou from "./MediaOfYou";

const SelfProfile = () => {
  const utils = api.useUtils();
  const navigation = useNavigation();

  const profileData = utils.profile.getFullProfileSelf.getData();

  const {
    data: recommendationsData,
    isLoading: isLoadingRecommendationsData,
    refetch: refetchRecommendationsData,
  } = api.contacts.getRecommendationProfilesSelf.useQuery();

  const {
    data: friendsData,
    isLoading: isLoadingFriendsData,
    refetch: refetchFriendsData,
  } = api.friend.paginateFriendsSelf.useInfiniteQuery(
    { pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

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
    </BaseScreenView>
  );
};

export default SelfProfile;
