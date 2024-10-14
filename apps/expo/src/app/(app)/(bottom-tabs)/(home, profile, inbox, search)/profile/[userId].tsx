import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
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
import useRouteProfile from "~/hooks/useRouteProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

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

const OtherProfile = React.memo(() => {
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const { routeProfile } = useRouteProfile();
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
  } = api.profile.getFullProfileOther.useQuery(
    { userId },
    { refetchOnMount: true },
  );

  const blocked = otherProfileData?.networkStatus.blocked ?? false;
  const isPrivate = otherProfileData?.networkStatus.privacy === "private";
  const isFollowing =
    otherProfileData?.networkStatus.targetUserFollowState === "Following";
  const canViewContent = useMemo(
    () => !blocked && (!isPrivate || isFollowing),
    [blocked, isPrivate, isFollowing],
  );

  const {
    data: recommendationsData,
    isLoading: isLoadingRecommendationsData,
    refetch: refetchRecommendationsData,
  } = api.contacts.getRecommendationProfilesSelf.useQuery(undefined, {
    refetchOnMount: true,
  });

  const {
    data: friendsData,
    isLoading: isLoadingFriendsData,
    refetch: refetchFriendsData,
  } = api.friend.paginateFriendsOthers.useInfiniteQuery(
    { userId, pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!userId,
      refetchOnMount: true,
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
      refetchOnMount: true,
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

  const recommendationItems = useMemo(
    () => recommendationsData ?? [],
    [recommendationsData],
  );

  const isLoading =
    isLoadingProfileData ||
    isLoadingFriendsData ||
    isLoadingPostData ||
    isLoadingRecommendationsData;

  const navigateToProfile = useCallback(
    ({ userId, username }: { userId: string; username: string }) => {
      routeProfile({ userId, username });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [routeProfile],
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

  const handleOpenMoreOptionsSheet = useCallback(() => {
    setSheetState("moreOptions");
  }, []);

  const handleCloseMoreOptionsSheet = useCallback(() => {
    setSheetState("closed");
  }, []);

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
  }, [navigation, username, otherProfileData, handleOpenMoreOptionsSheet]);

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
    (item: Post) => (
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
          isViewable: viewableItems.includes(item.postId),
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
      viewableItems,
    ],
  );

  const { actions } = useProfileActions(userId);

  const renderActionButtons = useCallback((): ProfileAction[] => {
    if (otherProfileData === undefined) return [];

    const { privacy, blocked, targetUserFollowState, targetUserFriendState } =
      otherProfileData.networkStatus;

    if (blocked) {
      return [
        {
          label: "Blocked",
          onPress: () => {},
          loading: false,
          disabled: true,
          backgroundColor: "$gray3",
        },
      ];
    }

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

  const profileHeaderData = useMemo(
    () => ({
      userId: otherProfileData?.userId ?? "",
      username: otherProfileData?.username ?? "",
      name: otherProfileData?.name ?? "",
      bio: otherProfileData?.bio ?? "",
      followerCount: otherProfileData?.followerCount ?? 0,
      followingCount: otherProfileData?.followingCount ?? 0,
      profilePictureUrl: otherProfileData?.profilePictureUrl,
    }),
    [
      otherProfileData?.userId,
      otherProfileData?.username,
      otherProfileData?.name,
      otherProfileData?.bio,
      otherProfileData?.followerCount,
      otherProfileData?.followingCount,
      otherProfileData?.profilePictureUrl,
    ],
  );

  // TODO: There is likely another solution to this other than useMemo()
  const renderHeader = useMemo(
    () => (
      <YStack gap="$4">
        <ProfileHeaderDetails
          loading={isLoading}
          data={profileHeaderData}
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

        {friendItems.length > 0 && !blocked ? (
          <PeopleCarousel
            loading={isLoading}
            data={friendItems}
            title="Friends 🔥"
            showMore={friendItems.length < (otherProfileData?.friendCount ?? 0)}
            onTitlePress={() =>
              router.push({
                pathname: "/profile/connections/friend-list",
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
            loading={isLoading}
            data={recommendationItems}
            title="Suggestions 🔥"
            showMore={friendItems.length < (otherProfileData?.friendCount ?? 0)}
            onItemPress={navigateToProfile}
          />
        )}
      </YStack>
    ),
    [
      isLoading,
      profileHeaderData,
      canViewContent,
      renderActionButtons,
      friendItems,
      blocked,
      recommendationItems,
      otherProfileData?.friendCount,
      router,
      userId,
      username,
      navigateToProfile,
    ],
  );

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <View paddingTop="$4">{renderPost(item)}</View>
    ),
    [renderPost],
  );

  const renderNoPosts = useCallback(() => {
    if (blocked) {
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
        />
      </View>
    );
  }, [blocked, isPrivate, isFollowing]);

  const listFooterComponent = useCallback(() => {
    if (isLoading) {
      return (
        <YStack gap="$4">
          <PostCard loading />
          <PostCard loading />
        </YStack>
      );
    }
    if (postItems.length === 0) {
      return renderNoPosts();
    }
    return null;
  }, [isLoading, postItems.length, renderNoPosts]);

  if (isLoading) {
    return (
      <BaseScreenView padding={0} paddingBottom={0}>
        <YStack gap="$4">
          <ProfileHeaderDetails loading />
          <PeopleCarousel loading />
          <PostCard loading />
        </YStack>
      </BaseScreenView>
    );
  }

  return (
    <>
      <BaseScreenView padding={0} paddingBottom={0} scrollEnabled={false}>
        <FlashList
          ref={scrollRef}
          data={postItems}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderNoPosts}
          ListFooterComponent={listFooterComponent}
          keyExtractor={(item) => `other-profile-post-${item.postId}`}
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
});

export default OtherProfile;
