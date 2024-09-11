import React, { useCallback, useLayoutEffect } from "react";
import * as Haptics from "expo-haptics";
import { useNavigation, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { getToken, Spacer } from "tamagui";

import OtherPost from "~/components/NewPostTesting/OtherPost";
import ProfileHeaderDetails from "~/components/NewProfileTesting/ProfileHeader";
import { BaseScreenView } from "~/components/Views";
import { api, RouterOutputs } from "~/utils/api";
import MediaOfYou from "./MediaOfYou";

type Post = RouterOutputs["post"]["paginatePostsOfUserSelf"]["items"][number];

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

  const renderItem = useCallback(
    (item: Post) => (
      <OtherPost
        key={item.postId}
        id={item.postId}
        createdAt={item.createdAt}
        caption={item.caption}
        self={{
          id: profileData?.userId ?? "",
          username: profileData?.username ?? "",
          profilePicture: profileData?.profilePictureUrl,
        }}
        author={{
          id: item.authorId,
          username: item.authorUsername ?? "",
        }}
        recipient={{
          id: item.recipientId,
          username: item.recipientUsername ?? "",
          profilePicture: item.recipientProfilePicture,
        }}
        media={{
          type: item.mediaType,
          url: item.imageUrl,
          dimensions: {
            width: item.width,
            height: item.height,
          },
        }}
        stats={{
          likes: item.likesCount,
          comments: item.commentsCount,
        }}
      />
    ),
    [profileData],
  );

  const renderHeader = useCallback(
    () => (
      <ProfileHeaderDetails
        loading={false}
        data={{
          userId: profileData?.userId ?? "",
          username: profileData?.username ?? "",
          name: profileData?.name ?? "",
          bio: profileData?.bio ?? "",
          followerCount: profileData?.followerCount ?? 0,
          followingCount: profileData?.followingCount ?? 0,
          profilePictureUrl: profileData?.profilePictureUrl,
        }}
        onFollowingPress={() => router.push("/self-connections/following-list")}
        onFollowersPress={() => router.push("/self-connections/followers-list")}
        actions={[
          {
            label: "Edit Profile",
            onPress: () => {
              router.push("/edit-profile");
            },
          },
          {
            label: "Share Profile",
            onPress: () => {
              router.push("/share-profile");
            },
          },
        ]}
      />
    ),
    [profileData, router],
  );

  return (
    <BaseScreenView padding={0} paddingBottom={0}>
      <FlashList
        data={posts}
        renderItem={({ item }) => renderItem(item)}
        ListHeaderComponent={renderHeader}
        estimatedItemSize={300}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        onRefresh={refetchPosts}
        refreshing={isLoadingPostData}
        ListHeaderComponentStyle={{
          marginBottom: getToken("$4", "space") as number,
        }}
      />
    </BaseScreenView>
  );
};

export default SelfProfile;
