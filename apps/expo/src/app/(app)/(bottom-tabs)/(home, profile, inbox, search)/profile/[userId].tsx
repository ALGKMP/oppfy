import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { utils } from "@react-native-firebase/app";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { CameraOff, Lock, MoreHorizontal, UserX } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { getToken, Spacer, View, YStack } from "tamagui";

import PeopleCarousel from "~/components/Carousels/PeopleCarousel";
import OtherPost from "~/components/NewPostTesting/OtherPost";
import PostCard from "~/components/NewPostTesting/ui/PostCard";
import type { ProfileAction } from "~/components/NewProfileTesting/ui/ProfileHeader";
import ProfileHeaderDetails from "~/components/NewProfileTesting/ui/ProfileHeader";
import type { ButtonOption } from "~/components/Sheets";
import { ActionSheet } from "~/components/Sheets";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import useProfile from "~/hooks/useProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const useProfileActions = (userId: string) => {
  const utils = api.useUtils();

  // State to track invalidation status per action using action keys
  const [isInvalidatingByAction, setIsInvalidatingByAction] = useState<
    Record<string, boolean>
  >({});

  // Helper function to invalidate queries for a specific action
  const invalidateQueries = useCallback(
    async (actionKey: string) => {
      setIsInvalidatingByAction((prev) => ({ ...prev, [actionKey]: true }));
      await Promise.all([
        utils.profile.getFullProfileOther.invalidate({ userId }),
        utils.contacts.getRecommendationProfilesSelf.invalidate(),
      ]);
      setIsInvalidatingByAction((prev) => ({ ...prev, [actionKey]: false }));
    },
    [utils, userId],
  );

  // Mutations with onSettled callbacks that trigger invalidation per action
  const followUser = api.follow.followUser.useMutation({
    onSettled: () => {
      void invalidateQueries("follow");
    },
  });

  const unfollowUser = api.follow.unfollowUser.useMutation({
    onSettled: () => {
      void invalidateQueries("unfollow");
    },
  });

  const addFriend = api.friend.sendFriendRequest.useMutation({
    onSettled: () => {
      void invalidateQueries("addFriend");
    },
  });

  const removeFriend = api.friend.removeFriend.useMutation({
    onSettled: () => {
      void invalidateQueries("removeFriend");
    },
  });

  const cancelFollowRequest = api.follow.cancelFollowRequest.useMutation({
    onSettled: () => {
      void invalidateQueries("cancelFollowRequest");
    },
  });

  const cancelFriendRequest = api.friend.cancelFriendRequest.useMutation({
    onSettled: () => {
      void invalidateQueries("cancelFriendRequest");
    },
  });

  // Action handlers
  const handleFollow = useCallback(
    () => followUser.mutate({ userId }),
    [followUser, userId],
  );

  const handleUnfollow = useCallback(
    () => unfollowUser.mutate({ userId }),
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

  // Determine if any action is currently loading
  const isAnyActionLoading = useMemo(() => {
    return (
      followUser.isLoading ||
      unfollowUser.isLoading ||
      addFriend.isLoading ||
      removeFriend.isLoading ||
      cancelFollowRequest.isLoading ||
      cancelFriendRequest.isLoading ||
      Object.values(isInvalidatingByAction).some(
        (isInvalidating) => isInvalidating,
      )
    );
  }, [
    followUser.isLoading,
    unfollowUser.isLoading,
    addFriend.isLoading,
    removeFriend.isLoading,
    cancelFollowRequest.isLoading,
    cancelFriendRequest.isLoading,
    isInvalidatingByAction,
  ]);

  // Return actions with handlers and loading states
  return {
    actions: {
      follow: {
        handler: handleFollow,
        loading: followUser.isLoading || isInvalidatingByAction.follow,
        disabled: isAnyActionLoading,
      },
      unfollow: {
        handler: handleUnfollow,
        loading: unfollowUser.isLoading || isInvalidatingByAction.unfollow,
        disabled: isAnyActionLoading,
      },
      addFriend: {
        handler: handleAddFriend,
        loading: addFriend.isLoading || isInvalidatingByAction.addFriend,
        disabled: isAnyActionLoading,
      },
      removeFriend: {
        handler: handleRemoveFriend,
        loading: removeFriend.isLoading || isInvalidatingByAction.removeFriend,
        disabled: isAnyActionLoading,
      },
      cancelFollowRequest: {
        handler: handleCancelFollowRequest,
        loading:
          cancelFollowRequest.isLoading ||
          isInvalidatingByAction.cancelFollowRequest,
        disabled: isAnyActionLoading,
      },
      cancelFriendRequest: {
        handler: handleCancelFriendRequest,
        loading:
          cancelFriendRequest.isLoading ||
          isInvalidatingByAction.cancelFriendRequest,
        disabled: isAnyActionLoading,
      },
    },
  };
};

type Post = RouterOutputs["post"]["paginatePostsByUserOther"]["items"][number];

const OtherProfile = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const toast = useToastController();

  const utils = api.useUtils();

  const { userId, username } = useLocalSearchParams<{
    userId: string;
    username: string;
  }>();

  const { data: selfProfileData } = useProfile();

  const {
    data: otherProfileData,
    isLoading: isLoadingProfileData,
    refetch: refetchProfileData,
  } = api.profile.getFullProfileOther.useQuery({ userId });

  const isBlocked = otherProfileData?.networkStatus.blocked ?? false;
  const isPrivate = otherProfileData?.networkStatus.privacy === "private";
  const isFollowing =
    otherProfileData?.networkStatus.targetUserFollowState === "Following";
  const canViewContent = !isBlocked && (!isPrivate || isFollowing);

  const {
    data: recommendationsData,
    isLoading: isLoadingRecommendationsData,
    refetch: refetchRecommendationsData,
  } = api.contacts.getRecommendationProfilesSelf.useQuery();

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
    await Promise.all([
      refetchProfileData(),
      refetchRecommendationsData(),
      refetchFriendsData(),
      refetchPosts(),
    ]);
    setIsRefreshing(false);
  }, [
    refetchFriendsData,
    refetchPosts,
    refetchProfileData,
    refetchRecommendationsData,
  ]);

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

  const [sheetState, setSheetState] = useState<
    "closed" | "moreOptions" | "reportOptions"
  >("closed");

  const { isLoading: isBlocking, ...blockUser } =
    api.block.blockUser.useMutation({
      onMutate: async (_newBlockedUser) => {
        // Cancel outgoing fetches (so they don't overwrite our optimistic update)
        await utils.profile.getFullProfileOther.cancel();

        // Get the data from the queryCache
        const prevData = utils.profile.getFullProfileOther.getData({ userId });
        if (prevData === undefined) return;

        // Optimistically update the data
        utils.profile.getFullProfileOther.setData(
          { userId },
          {
            ...prevData,
            networkStatus: {
              ...prevData.networkStatus,
              blocked: true,
            },
          },
        );

        // Return the previous data so we can revert if something goes wrong
        return { prevData };
      },
      onError: (_err, _newBlockedUser, ctx) => {
        if (ctx === undefined) return;

        // If the mutation fails, use the context-value from onMutate
        utils.profile.getFullProfileOther.setData({ userId }, ctx.prevData);
      },
      onSettled: async () => {
        await utils.profile.getFullProfileOther.invalidate({ userId });
      },
    });
  const { isLoading: isUnblocking, ...unblockUser } =
    api.block.unblockUser.useMutation({
      onMutate: async (_newUnblockedUser) => {
        // Cancel outgoing fetches (so they don't overwrite our optimistic update)
        await utils.profile.getFullProfileOther.cancel();

        // Get the data from the queryCache
        const prevData = utils.profile.getFullProfileOther.getData({ userId });
        if (prevData === undefined) return;

        // Optimistically update the data
        utils.profile.getFullProfileOther.setData(
          { userId },
          {
            ...prevData,
            networkStatus: {
              ...prevData.networkStatus,
              blocked: false,
            },
          },
        );

        // Return the previous data so we can revert if something goes wrong
        return { prevData };
      },
      onError: (_err, _newUnblockedUser, ctx) => {
        if (ctx === undefined) return;

        // If the mutation fails, use the context-value from onMutate
        utils.profile.getFullProfileOther.setData({ userId }, ctx.prevData);
      },
      onSettled: async () => {
        await utils.profile.getFullProfileOther.invalidate({ userId });
      },
    });

  const handleOpenMoreOptionsSheet = () => {
    setSheetState("moreOptions");
  };

  const handleCloseMoreOptionsSheet = () => {
    setSheetState("closed");
  };

  const handleBlockUser = useCallback(async () => {
    await blockUser.mutateAsync({ userId });
    toast.show("User Blocked");
  }, [blockUser, userId, toast]);

  const handleUnblockUser = useCallback(async () => {
    await unblockUser.mutateAsync({ userId });
    toast.show("User Unblocked");
  }, [unblockUser, userId, toast]);

  const moreOptionsButtonOptions: ButtonOption[] = useMemo(() => {
    const isBlocked = otherProfileData?.networkStatus.blocked ?? false;

    return [
      {
        text: isBlocked
          ? isUnblocking
            ? "Unblocking..."
            : "Unblock User"
          : isBlocking
            ? "Blocking..."
            : "Block User",
        textProps: {
          color: isBlocking || isUnblocking ? "$gray9" : "$red9",
        },
        autoClose: false,
        disabled: isBlocking || isUnblocking,
        onPress: isBlocked ? handleUnblockUser : handleBlockUser,
      },
    ];
  }, [
    otherProfileData?.networkStatus.blocked,
    isUnblocking,
    isBlocking,
    handleUnblockUser,
    handleBlockUser,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: username,
      headerRight: () => (
        <View>
          <TouchableOpacity onPress={handleOpenMoreOptionsSheet}>
            <MoreHorizontal />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, username, otherProfileData]);

  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visibleItemIds = viewableItems
        .filter((token) => token.isViewable)
        .map((token) => token.item?.postId)
        .filter((id): id is string => id !== undefined);

      setViewableItems(visibleItemIds);
    },
    [],
  );

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 40,
    }),
    [],
  );

  const renderPost = useCallback(
    (item: Post, isViewable: boolean) => (
      <OtherPost
        key={item.postId}
        id={item.postId}
        endpoint="other-profile"
        createdAt={item.createdAt}
        caption={item.caption}
        self={{
          id: selfProfileData?.userId ?? "",
          username: selfProfileData?.username ?? "",
          profilePicture: selfProfileData?.profilePictureUrl,
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
          isViewable: isViewable,
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
    [
      selfProfileData?.profilePictureUrl,
      selfProfileData?.userId,
      selfProfileData?.username,
    ],
  );

  const { actions } = useProfileActions(userId);

  const renderActionButtons = useCallback((): ProfileAction[] => {
    if (!otherProfileData) return [];

    const { privacy, blocked, targetUserFollowState, targetUserFriendState } =
      otherProfileData.networkStatus;

    const buttonConfigs = {
      follow: { label: "Follow", action: "follow", backgroundColor: "#F214FF" },
      unfollow: { label: "Unfollow", action: "unfollow" },
      friend: {
        label: "Friend",
        action: "addFriend",
        backgroundColor: "#F214FF",
      },
      removeFriend: { label: "Remove Friend", action: "removeFriend" },
      cancelFollowRequest: {
        label: "Cancel Follow Request",
        action: "cancelFollowRequest",
      },
      cancelFriendRequest: {
        label: "Cancel Friend Request",
        action: "cancelFriendRequest",
      },
    };

    const buttonCombinations: Record<string, (keyof typeof buttonConfigs)[]> = {
      public_NotFollowing_NotFriends: ["follow", "friend"],
      public_Following_NotFriends: ["unfollow", "friend"],
      public_Following_OutboundRequest: ["cancelFriendRequest"],
      public_Following_Friends: ["removeFriend"],
      private_NotFollowing_NotFriends: ["follow", "friend"],
      private_OutboundRequest_NotFriends: ["cancelFollowRequest", "friend"],
      private_Following_NotFriends: ["unfollow", "friend"],
      private_OutboundRequest_OutboundRequest: ["cancelFriendRequest"],
      private_Following_OutboundRequest: ["cancelFriendRequest"],
      private_Following_Friends: ["removeFriend"],
    };

    const key = `${privacy}_${targetUserFollowState}_${targetUserFriendState}`;
    const buttonKeys = buttonCombinations[key] ?? [];

    return buttonKeys.map((buttonKey) => {
      const config = buttonConfigs[buttonKey];
      const { handler, loading, disabled } =
        actions[config.action as keyof typeof actions];

      return {
        label: config.label,
        onPress: handler,
        loading,
        disabled: disabled || blocked,
        backgroundColor:
          "backgroundColor" in config ? config.backgroundColor : undefined,
      };
    });
  }, [otherProfileData, actions]);

  const renderHeader = useCallback(
    () => (
      <YStack gap="$4">
        <ProfileHeaderDetails
          loading={false}
          data={{
            userId: otherProfileData?.userId ?? "",
            username: otherProfileData?.username ?? "",
            name: otherProfileData?.name ?? "",
            bio: otherProfileData?.bio ?? "",
            followerCount: otherProfileData?.followerCount ?? 0,
            followingCount: otherProfileData?.followingCount ?? 0,
            profilePictureUrl: otherProfileData?.profilePictureUrl,
          }}
          onFollowingPress={
            canViewContent
              ? () =>
                  router.push({
                    pathname: "/profile/connections/following-list",
                    params: { userId, username },
                  })
              : undefined
          }
          onFollowersPress={
            canViewContent
              ? () =>
                  router.push({
                    pathname: "/profile/connections/followers-list",
                    params: { userId, username },
                  })
              : undefined
          }
          actions={renderActionButtons()}
        />

        {friendItems.length > 0 ? (
          <PeopleCarousel
            loading={false}
            data={friendItems}
            title="Friends 🔥"
            showMore={friendItems.length < (otherProfileData?.friendCount ?? 0)}
            onTitlePress={() =>
              router.push({
                pathname: "/profile/connections/following-list",
                params: { userId, username },
              })
            }
            onItemPress={navigateToProfile}
            onShowMore={() =>
              router.push({
                pathname: "/profile/connections/friend-list",
                params: { userId, username },
              })
            }
          />
        ) : (
          <PeopleCarousel
            loading={isLoadingRecommendationsData}
            data={recommendationsData ?? []}
            title="Suggestions 🔥"
            onItemPress={navigateToProfile}
          />
        )}
      </YStack>
    ),
    [
      canViewContent,
      friendItems,
      isLoadingRecommendationsData,
      navigateToProfile,
      otherProfileData?.bio,
      otherProfileData?.followerCount,
      otherProfileData?.followingCount,
      otherProfileData?.friendCount,
      otherProfileData?.name,
      otherProfileData?.profilePictureUrl,
      otherProfileData?.userId,
      otherProfileData?.username,
      recommendationsData,
      renderActionButtons,
      router,
      userId,
      username,
    ],
  );

  const renderContent = useCallback(() => {
    if (isBlocked) {
      return (
        <View paddingTop="$6">
          <EmptyPlaceholder
            icon={<UserX size="$10" />}
            title="This user has been blocked"
            subtitle="You cannot view their content or interact with them."
          />
        </View>
      );
    }

    if (isPrivate && !isFollowing) {
      return (
        <View paddingTop="$6">
          <EmptyPlaceholder
            icon={<Lock size="$10" />}
            title="This account is private"
            subtitle="You need to follow this user to view their posts"
          />
        </View>
      );
    }

    return (
      <View paddingTop="$6">
        <EmptyPlaceholder
          icon={<CameraOff size="$10" />}
          title="No posts yet"
          subtitle="Be the first to post!"
        />
      </View>
    );
  }, [isBlocked, isPrivate, isFollowing]);

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
    <>
      <BaseScreenView padding={0} paddingBottom={0}>
        <FlashList
          data={postItems}
          renderItem={({ item }) =>
            renderPost(item, viewableItems.includes(item.postId))
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderContent}
          keyExtractor={(item) => `self-profile-post-${item.postId}`}
          estimatedItemSize={300}
          showsVerticalScrollIndicator={false}
          onEndReached={handleOnEndReached}
          onRefresh={handleRefresh}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          extraData={{ viewableItems, postItems }}
          refreshing={isRefreshing}
          ItemSeparatorComponent={() => <Spacer size="$4" />}
          ListHeaderComponentStyle={{
            marginBottom: getToken("$4", "space") as number,
          }}
        />
      </BaseScreenView>

      <ActionSheet
        isVisible={sheetState === "moreOptions"}
        buttonOptions={moreOptionsButtonOptions}
        onCancel={handleCloseMoreOptionsSheet}
      />
    </>
  );
};

export default OtherProfile;
