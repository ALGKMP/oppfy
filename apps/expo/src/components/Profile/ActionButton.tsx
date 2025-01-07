import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { Button, Text, View, XStack } from "~/components/ui";
import { Skeleton } from "~/components/ui/Skeleton";
import { Spinner } from "~/components/ui/Spinner";
import { api } from "~/utils/api";

/*
 * TODO: Instead of passing in the networkStatus and userId as props,
 * we could make this component make the requests itself.
 * This would make the component more flexible and easier to understand.
 */

interface ActionButtonProps {
  userId?: string; // TODO: For now, this is only used for Other Profiles
}

const ActionButton = ({ userId }: ActionButtonProps) => {
  const { actions } = useProfileActionButtons(userId);

  // Only make the network status query if userId is provided
  const { data: networkStatus, isLoading: isNetworkStatusLoading } =
    api.profile.getNetworkRelationships.useQuery(
      { userId: userId! },
      { enabled: !!userId },
    );

  // Handle self-profile case
  if (!userId) {
    return (
      <XStack gap="$4">
        {Object.entries(actions).map(([key, { handler, loading }]) => (
          <Button key={key} flex={1} rounded outlined onPress={handler}>
            <XStack gap="$2" alignItems="center">
              <Text>
                {key === "editProfile" ? "Edit Profile" : "Share Profile"}
              </Text>
              {loading && <Spinner size="small" color="$color" />}
            </XStack>
          </Button>
        ))}
      </XStack>
    );
  }

  if (isNetworkStatusLoading) {
    return (
      <XStack gap="$4">
        <View flex={1}>
          <Skeleton width="100%" height={44} radius={20} />
        </View>
        <View flex={1}>
          <Skeleton width="100%" height={44} radius={20} />
        </View>
      </XStack>
    );
  }

  if (networkStatus?.isTargetUserBlocked || networkStatus?.isOtherUserBlocked) {
    return (
      <XStack gap="$4">
        <Button
          flex={1}
          borderRadius={20}
          backgroundColor="$gray3"
          disabled={true}
        >
          <Text>Blocked</Text>
        </Button>
      </XStack>
    );
  }

  const { privacy, targetUserFollowState, targetUserFriendState } =
    networkStatus ?? {};

  const buttonConfigs = {
    follow: { label: "Follow", action: "follow", backgroundColor: "#F214FF" },
    unfollow: {
      label: "Unfollow",
      action: "unfollow",
      backgroundColor: "$gray3",
    },
    friend: {
      label: "Add Friend",
      action: "addFriend",
      backgroundColor: "#F214FF",
    },
    removeFriend: {
      label: "Remove Friend",
      action: "removeFriend",
      backgroundColor: "$gray3",
    },
    cancelFollowRequest: {
      label: "Cancel Follow Request",
      action: "cancelFollowRequest",
      backgroundColor: "$gray3",
    },
    cancelFriendRequest: {
      label: "Cancel Friend Request",
      action: "cancelFriendRequest",
      backgroundColor: "$gray3",
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

  return (
    <XStack gap="$4">
      {buttonKeys.map((buttonKey) => {
        const config = buttonConfigs[buttonKey];
        const actionKey = config.action as keyof typeof actions;
        const action = actions[actionKey];
        if (!action) return null;
        const { handler, loading, disabled } = action;

        return (
          <Button
            key={buttonKey}
            flex={1}
            backgroundColor={config.backgroundColor}
            onPress={handler}
            disabled={disabled}
            borderWidth={1}
            rounded
            outlined
            borderColor="white"
            // height={40}
            pressStyle={{
              borderWidth: 1,
              borderColor: "white",
            }}
          >
            <XStack
              position="relative"
              justifyContent="center"
              alignItems="center"
            >
              <Text
                textAlign="center"
                // opacity={loading ? 0 : 1} // Hide text when loading
              >
                {config.label}
              </Text>
              {loading && (
                <XStack
                  position="absolute"
                  top={0}
                  bottom={0}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Spinner size="small" color="$color" />
                </XStack>
              )}
            </XStack>
          </Button>
        );
      })}
    </XStack>
  );
};

/*
 * ==========================================
 * ============== Hooks =====================
 * ==========================================
 */

/**
 * TODO: A hook that returns the functions to handle the actions for the profile (This is old code, change later)
 *
 * @param {string} userId - The userId of the user
 * @returns {actions: {follow: {handler: () => void, loading: boolean}, unfollow: {handler: () => void, loading: boolean}, cancelFollowRequest: {handler: () => void, loading: boolean}, cancelFriendRequest: {handler: () => void, loading: boolean}, removeFriend: {handler: () => void, loading: boolean}}}
 */
const useProfileActionButtons = (userId?: string) => {
  const utils = api.useUtils();
  const router = useRouter();
  const [isInvalidatingByAction, setIsInvalidatingByAction] = useState<
    Record<string, boolean>
  >({});

  // NOTE: mutations must be declared unconditionally to not break the rules of hooks
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

  const invalidateQueries = async (actionKey: string) => {
    if (!userId) return;
    setIsInvalidatingByAction((prev) => ({ ...prev, [actionKey]: true }));

    try {
      await Promise.all([
        utils.profile.getNetworkRelationships.invalidate({ userId: userId! }),
        utils.profile.getFullProfileOther.invalidate({ userId }),
        utils.contacts.getRecommendationProfilesSelf.invalidate(),
      ]);
    } finally {
      setIsInvalidatingByAction((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const isAnyActionLoading =
    followUser.isPending ||
    unfollowUser.isPending ||
    addFriend.isPending ||
    removeFriend.isPending ||
    cancelFollowRequest.isPending ||
    cancelFriendRequest.isPending ||
    Object.values(isInvalidatingByAction).some(
      (isInvalidating) => isInvalidating,
    );

  console.log("isAnyActionLoading", isAnyActionLoading);
  console.log("followUser.isPending", followUser.isPending);
  console.log("unfollowUser.isPending", unfollowUser.isPending);
  console.log("addFriend.isPending", addFriend.isPending);
  console.log("removeFriend.isPending", removeFriend.isPending);
  console.log("cancelFollowRequest.isPending", cancelFollowRequest.isPending);
  console.log("cancelFriendRequest.isPending", cancelFriendRequest.isPending);
  console.log("isInvalidatingByAction", isInvalidatingByAction);
  // Create actions object based on userId
  const actions = userId
    ? {
        follow: {
          handler: () => followUser.mutate({ userId }),
          loading: followUser.isPending || isInvalidatingByAction.follow,
          disabled: isAnyActionLoading,
        },
        unfollow: {
          handler: () => unfollowUser.mutate({ userId }),
          loading: unfollowUser.isPending || isInvalidatingByAction.unfollow,
          disabled: isAnyActionLoading,
        },
        addFriend: {
          handler: () => addFriend.mutate({ recipientId: userId }),
          loading: addFriend.isPending || isInvalidatingByAction.addFriend,
          disabled: isAnyActionLoading,
        },
        removeFriend: {
          handler: () => removeFriend.mutate({ recipientId: userId }),
          loading:
            removeFriend.isPending || isInvalidatingByAction.removeFriend,
          disabled: isAnyActionLoading,
        },
        cancelFollowRequest: {
          handler: () => cancelFollowRequest.mutate({ recipientId: userId }),
          loading:
            cancelFollowRequest.isPending ||
            isInvalidatingByAction.cancelFollowRequest,
          disabled: isAnyActionLoading,
        },
        cancelFriendRequest: {
          handler: () => cancelFriendRequest.mutate({ recipientId: userId }),
          loading:
            cancelFriendRequest.isPending ||
            isInvalidatingByAction.cancelFriendRequest,
          disabled: isAnyActionLoading,
        },
      }
    : {
        editProfile: {
          handler: () => router.push("/edit-profile"),
          loading: false,
          disabled: false,
        },
        shareProfile: {
          handler: () => router.push("/share-profile"),
          loading: false,
          disabled: false,
        },
      };

  return { actions };
};

export default ActionButton;
