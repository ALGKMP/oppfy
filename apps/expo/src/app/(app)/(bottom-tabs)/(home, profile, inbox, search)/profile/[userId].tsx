/* eslint-disable @typescript-eslint/no-empty-function */
import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { MoreHorizontal } from "@tamagui/lucide-icons";
import { getToken, Spacer, YStack } from "tamagui";

import PeopleCarousel from "~/components/Carousels/PeopleCarousel";
import OtherPost from "~/components/NewPostTesting/OtherPost";
import PostCard from "~/components/NewPostTesting/ui/PostCard";
import type { ProfileAction } from "~/components/NewProfileTesting/ui/ProfileHeader";
import ProfileHeaderDetails from "~/components/NewProfileTesting/ui/ProfileHeader";
import { BaseScreenView } from "~/components/Views";
import useProfile from "~/hooks/useProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const useProfileActions = (userId: string) => {
  const utils = api.useUtils();

  const followUser = api.follow.followUser.useMutation({
    onSettled: () => utils.profile.getFullProfileOther.invalidate({ userId }),
  });

  const unfollowUser = api.follow.unfollowUser.useMutation({
    onSettled: () => utils.profile.getFullProfileOther.invalidate({ userId }),
  });

  const addFriend = api.friend.sendFriendRequest.useMutation({
    onSettled: () => utils.profile.getFullProfileOther.invalidate({ userId }),
  });

  const removeFriend = api.friend.removeFriend.useMutation({
    onSettled: () => utils.profile.getFullProfileOther.invalidate({ userId }),
  });

  const cancelFollowRequest = api.request.cancelFollowRequest.useMutation({
    onSettled: () => utils.profile.getFullProfileOther.invalidate({ userId }),
  });

  const cancelFriendRequest = api.request.cancelFriendRequest.useMutation({
    onSettled: () => utils.profile.getFullProfileOther.invalidate({ userId }),
  });

  const handleFollow = useCallback(
    () => followUser.mutate({ userId: userId }),
    [followUser, userId],
  );
  const handleUnfollow = useCallback(
    () => unfollowUser.mutate({ userId: userId }),
    [unfollowUser, userId],
  );
  const handleAddFriend = useCallback(
    () => addFriend.mutate({ recipientId: userId }),
    [addFriend, userId],
  );
  const handleRemoveFriend = useCallback(
    () => removeFriend.mutate({ recipientId: userId }),
    [removeFriend, userId],
  );
  const handleCancelFollowRequest = useCallback(
    () => cancelFollowRequest.mutate({ recipientId: userId }),
    [cancelFollowRequest, userId],
  );
  const handleCancelFriendRequest = useCallback(
    () => cancelFriendRequest.mutate({ recipientId: userId }),
    [cancelFriendRequest, userId],
  );

  const isAnyActionLoading = useMemo(() => {
    return (
      followUser.isLoading ||
      unfollowUser.isLoading ||
      addFriend.isLoading ||
      removeFriend.isLoading ||
      cancelFollowRequest.isLoading ||
      cancelFriendRequest.isLoading
    );
  }, [
    followUser,
    unfollowUser,
    addFriend,
    removeFriend,
    cancelFollowRequest,
    cancelFriendRequest,
  ]);

  return {
    handleFollow,
    handleUnfollow,
    handleAddFriend,
    handleRemoveFriend,
    handleCancelFollowRequest,
    handleCancelFriendRequest,
    isFollowLoading: followUser.isLoading,
    isUnfollowLoading: unfollowUser.isLoading,
    isAddFriendLoading: addFriend.isLoading,
    isRemoveFriendLoading: removeFriend.isLoading,
    isCancelFollowRequestLoading: cancelFollowRequest.isLoading,
    isCancelFriendRequestLoading: cancelFriendRequest.isLoading,
    isAnyActionLoading,
  };
};

type Post = RouterOutputs["post"]["paginatePostsByUserOther"]["items"][number];

const OtherProfile = () => {
  const router = useRouter();
  const navigation = useNavigation();

  const { userId, username } = useLocalSearchParams<{
    userId: string;
    username: string;
  }>();

  const {
    handleFollow,
    handleUnfollow,
    handleAddFriend,
    handleRemoveFriend,
    handleCancelFollowRequest,
    handleCancelFriendRequest,
    isFollowLoading,
    isUnfollowLoading,
    isAddFriendLoading,
    isRemoveFriendLoading,
    isCancelFollowRequestLoading,
    isCancelFriendRequestLoading,
    isAnyActionLoading,
  } = useProfileActions(userId);

  const {
    data: profileData,
    isLoading: isLoadingProfileData,
    refetch: refetchProfileData,
  } = api.profile.getFullProfileOther.useQuery(
    { userId },
    { enabled: !!userId },
  );

  const { data: recommendationsData, isLoading: isLoadingRecommendationsData } =
    api.contacts.getRecommendationProfilesSelf.useQuery();

  const {
    data: friendsData,
    isLoading: isLoadingFriendsData,
    refetch: refetchFriendsData,
  } = api.friend.paginateFriendsOthers.useInfiniteQuery(
    { userId, pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!userId,
    },
  );

  const {
    data: postsData,
    isLoading: isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchPosts,
    hasNextPage,
  } = api.post.paginatePostsOfUserOther.useInfiniteQuery(
    { userId, pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!userId,
    },
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchPosts();
    setIsRefreshing(false);
  }, [refetchPosts]);

  const handleOnEndReached = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const postItems = useMemo(
    () => postsData?.pages.flatMap((page) => page.items) ?? [],
    [postsData],
  );

  const friendItems = useMemo(
    () => friendsData?.pages.flatMap((page) => page.items) ?? [],
    [friendsData],
  );

  const isLoadingData = useMemo(() => {
    return isLoadingProfileData || isLoadingFriendsData || isLoadingPostData;
  }, [isLoadingProfileData, isLoadingFriendsData, isLoadingPostData]);

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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: username,
      headerRight: () => (
        <View>
          <TouchableOpacity onPress={() => {}}>
            <MoreHorizontal />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, username, profileData]);

  const renderPost = useCallback(
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
          profilePicture: item.authorProfilePicture,
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

  const renderActionButtons = useCallback((): ProfileAction[] => {
    if (!profileData) return [];

    const { privacy, targetUserFollowState, targetUserFriendState } =
      profileData.networkStatus;

    console.log(privacy, targetUserFollowState, targetUserFriendState);
    console.log(isAnyActionLoading);

    const buttonCombinations: Record<string, ProfileAction[]> = {
      public_NotFollowing_NotFriends: [
        { label: "Follow", onPress: handleFollow, loading: isFollowLoading },
        {
          label: "Add Friend",
          onPress: handleAddFriend,
          loading: isAddFriendLoading,
        },
      ],
      public_Following_NotFriends: [
        {
          label: "Unfollow",
          onPress: handleUnfollow,
          loading: isUnfollowLoading,
        },
        {
          label: "Add Friend",
          onPress: handleAddFriend,
          loading: isAddFriendLoading,
        },
      ],
      public_Following_OutboundRequest: [
        {
          label: "Unfollow",
          onPress: handleUnfollow,
          loading: isUnfollowLoading,
        },
        {
          label: "Cancel Friend Request",
          onPress: handleCancelFriendRequest,
          loading: isCancelFriendRequestLoading,
        },
      ],
      public_Following_Friends: [
        {
          label: "Unfollow",
          onPress: handleUnfollow,
          loading: isUnfollowLoading,
        },
        {
          label: "Remove Friend",
          onPress: handleRemoveFriend,
          loading: isRemoveFriendLoading,
        },
      ],
      private_NotFollowing_NotFriends: [
        {
          label: "Request Follow",
          onPress: handleFollow,
          loading: isFollowLoading,
        },
        {
          label: "Add Friend",
          onPress: handleAddFriend,
          loading: isAddFriendLoading,
        },
      ],
      private_OutboundRequest_NotFriends: [
        {
          label: "Cancel Follow Request",
          onPress: handleCancelFollowRequest,
          loading: isCancelFollowRequestLoading,
          disabled: isAnyActionLoading,
        },
        {
          label: "Add Friend",
          onPress: handleAddFriend,
          loading: isAddFriendLoading,
          disabled: isAnyActionLoading,
        },
      ],
      private_Following_NotFriends: [
        {
          label: "Unfollow",
          onPress: handleUnfollow,
          loading: isUnfollowLoading,
          disabled: isAnyActionLoading,
        },
        {
          label: "Add Friend",
          onPress: handleAddFriend,
          loading: isAddFriendLoading,
          disabled: isAnyActionLoading,
        },
      ],
      private_OutboundRequest_OutboundRequest: [
        {
          label: "Cancel Follow Request",
          onPress: handleCancelFollowRequest,
          loading: isCancelFollowRequestLoading,
          disabled: isAnyActionLoading,
        },
        {
          label: "Cancel Friend Request",
          onPress: handleCancelFriendRequest,
          loading: isCancelFriendRequestLoading,
          disabled: isAnyActionLoading,
        },
      ],
      private_Following_OutboundRequest: [
        {
          label: "Unfollow",
          onPress: handleUnfollow,
          loading: isUnfollowLoading,
          disabled: isAnyActionLoading,
        },
        {
          label: "Cancel Friend Request",
          onPress: handleCancelFriendRequest,
          loading: isCancelFriendRequestLoading,
          disabled: isAnyActionLoading,
        },
      ],
      private_NotFollowing_OutboundRequest: [
        {
          label: "Cancel Friend Request",
          onPress: handleCancelFriendRequest,
          loading: isCancelFriendRequestLoading,
          disabled: isAnyActionLoading,
        },
      ],
      private_Following_Friends: [
        {
          label: "Unfollow",
          onPress: handleUnfollow,
          loading: isUnfollowLoading,
          disabled: isAnyActionLoading,
        },
        {
          label: "Remove Friend",
          onPress: handleRemoveFriend,
          loading: isRemoveFriendLoading,
          disabled: isAnyActionLoading,
        },
      ],
    };

    const key = `${privacy}_${targetUserFollowState}_${targetUserFriendState}`;
    return buttonCombinations[key] ?? [];
  }, [
    profileData,
    handleFollow,
    isFollowLoading,
    handleAddFriend,
    isAddFriendLoading,
    handleUnfollow,
    isUnfollowLoading,
    handleCancelFriendRequest,
    isCancelFriendRequestLoading,
    handleRemoveFriend,
    isRemoveFriendLoading,
    handleCancelFollowRequest,
    isCancelFollowRequestLoading,
    isAnyActionLoading,
  ]);

  const renderHeader = useCallback(
    () => (
      <YStack gap="$4">
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
          onFollowingPress={() =>
            router.push({
              pathname: "/profile/connections/[userId]/following-list",
              params: { userId, username },
            })
          }
          onFollowersPress={() =>
            router.push({
              pathname: "/profile/connections/[userId]/followers-list",
              params: { userId, username },
            })
          }
          actions={renderActionButtons()}
        />

        {friendItems.length > 0 ? (
          <PeopleCarousel
            loading={isLoadingFriendsData}
            data={friendItems}
            title="Friends 🔥"
            showMore={friendItems.length < (profileData?.friendCount ?? 0)}
            onItemPress={navigateToProfile}
            onShowMore={() => {
              // Handle show more friends
            }}
          />
        ) : (
          <PeopleCarousel
            loading={isLoadingRecommendationsData}
            data={recommendationsData ?? []}
            title="Recommended Friends 👥"
            showMore={false}
            onItemPress={navigateToProfile}
            onShowMore={() => {
              // Handle show more recommendations
            }}
          />
        )}
      </YStack>
    ),
    [
      friendItems,
      isLoadingFriendsData,
      isLoadingRecommendationsData,
      navigateToProfile,
      profileData?.bio,
      profileData?.followerCount,
      profileData?.followingCount,
      profileData?.friendCount,
      profileData?.name,
      profileData?.profilePictureUrl,
      profileData?.userId,
      profileData?.username,
      recommendationsData,
      renderActionButtons,
      router,
      userId,
      username,
    ],
  );

  if (isLoadingData) {
    return (
      <BaseScreenView padding={0} paddingBottom={0}>
        <FlashList
          data={PLACEHOLDER_DATA}
          renderItem={() => <PostCard loading />}
          ListHeaderComponent={() => (
            <YStack gap="$4">
              <ProfileHeaderDetails loading />
              <PeopleCarousel loading />
            </YStack>
          )}
          estimatedItemSize={300}
          keyExtractor={(_, index) => `loading-${index}`}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <Spacer size="$4" />}
          ListHeaderComponentStyle={{
            marginBottom: getToken("$4", "space") as number,
          }}
        />
      </BaseScreenView>
    );
  }

  return (
    <BaseScreenView padding={0} paddingBottom={0}>
      <FlashList
        data={postItems}
        renderItem={({ item }) => renderPost(item)}
        ListHeaderComponent={renderHeader}
        keyExtractor={(item) => `self-profile-post-${item.postId}`}
        estimatedItemSize={300}
        showsVerticalScrollIndicator={false}
        onEndReached={handleOnEndReached}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        ItemSeparatorComponent={() => <Spacer size="$4" />}
        ListHeaderComponentStyle={{
          marginBottom: getToken("$4", "space") as number,
        }}
      />
    </BaseScreenView>
  );
};

export default OtherProfile;
