import React, { useCallback, useLayoutEffect } from "react";
import * as Haptics from "expo-haptics";
import { useNavigation, useRouter } from "expo-router";

import ProfileHeaderDetails from "~/components/NewProfileTesting/ProfileHeader";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import MediaOfYou from "./MediaOfYou";

const SelfProfile = () => {
  const utils = api.useUtils();
  const navigation = useNavigation();
  const router = useRouter();

  const { data: profileData } = api.profile.getFullProfileSelf.useQuery(
    undefined,
    {
      staleTime: 1000 * 5,
    },
  );

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

  const navigateToProfile = useCallback(
    ({ userId, username }: { userId: string; username: string }) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({
        pathname: "/(profile)/profile/[userId]",
        params: { userId, username },
      });
    },
    [router],
  );

  return (
    <BaseScreenView padding={0}>
      <ProfileHeaderDetails
        loading={false}
        data={profileData}
        editableProfilePicture={false}
        onProfilePicturePress={() => {}}
        onFollowingPress={() => {}}
        onFollowersPress={() => {}}
        actions={[
          {
            label: "Edit Profile",
            onPress: () => {
              router.push("/edit-profile");
            },
          },
          {
            label: "Settings",
            onPress: () => {
              router.push("/(settings)");
            },
          },
        ]}
        profilePictureOverlay={null}
      />
      <MediaOfYou
        navigateToProfile={navigateToProfile}
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
