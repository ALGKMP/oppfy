import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import type { IconProps } from "@tamagui/helpers-icon";
import { Edit3, Share2, UserPlus, Users } from "@tamagui/lucide-icons";
import { XStack } from "tamagui";

import { Button } from "~/components/ui";
import { Skeleton } from "~/components/ui/Skeleton";
import { Spinner } from "~/components/ui/Spinner";
import { api } from "~/utils/api";

interface ActionButtonProps {
  userId?: string;
}

type IconComponent = React.FC<IconProps>;

interface ButtonConfig {
  label: string;
  action: string;
  icon: IconComponent;
  iconSize?: number;
  isPrimary?: boolean;
}

const ActionButton = ({ userId }: ActionButtonProps) => {
  const router = useRouter();
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
      <XStack gap="$3">
        <Button
          flex={1}
          size="$4"
          icon={<Edit3 size={18} />}
          variant="outlined"
          borderWidth={1.5}
          borderRadius="$6"
          onPress={() => router.push("/edit-profile")}
        >
          Edit Profile
        </Button>
        <Button
          flex={1}
          size="$4"
          icon={<Share2 size={18} />}
          backgroundColor="$primary"
          color="white"
          borderRadius="$6"
          onPress={() => router.push("/share-profile")}
        >
          Share Profile
        </Button>
      </XStack>
    );
  }

  if (isNetworkStatusLoading) {
    return (
      <XStack gap="$3">
        <Skeleton width="48%" height={44} radius="$6" />
        <Skeleton width="48%" height={44} radius="$6" />
      </XStack>
    );
  }

  if (networkStatus?.isTargetUserBlocked || networkStatus?.isOtherUserBlocked) {
    return (
      <XStack gap="$3">
        <Button
          flex={1}
          size="$4"
          backgroundColor="$gray3"
          borderRadius="$6"
          disabled={true}
        >
          Blocked
        </Button>
      </XStack>
    );
  }

  const { privacy, targetUserFollowState, targetUserFriendState } =
    networkStatus ?? {};

  const buttonConfigs: Record<string, ButtonConfig> = {
    follow: {
      label: "Follow",
      action: "follow",
      icon: UserPlus,
      iconSize: 18,
      isPrimary: true,
    },
    unfollow: {
      label: "Unfollow",
      action: "unfollow",
      icon: UserPlus,
      iconSize: 18,
      isPrimary: false,
    },
    friend: {
      label: "Add Friend",
      action: "addFriend",
      icon: Users,
      iconSize: 18,
      isPrimary:
        targetUserFollowState === "Following" ||
        targetUserFollowState === "OutboundRequest",
    },
    removeFriend: {
      label: "Remove",
      action: "removeFriend",
      icon: Users,
      iconSize: 18,
      isPrimary: false,
    },
    cancelFollowRequest: {
      label: "Requested",
      action: "cancelFollowRequest",
      icon: UserPlus,
      iconSize: 18,
      isPrimary: false,
    },
    cancelFriendRequest: {
      label: "Requested",
      action: "cancelFriendRequest",
      icon: Users,
      iconSize: 18,
      isPrimary: false,
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
    <XStack gap="$3">
      {buttonKeys.map((buttonKey) => {
        const config = buttonConfigs[buttonKey];
        if (!config) return null;

        const actionKey = config.action as keyof typeof actions;
        const action = actions[actionKey];
        if (!action) return null;

        const { handler, loading, disabled } = action;
        const Icon = config.icon;
        const iconSize = config.iconSize ?? 18;

        return (
          <Button
            key={buttonKey}
            flex={1}
            size="$4"
            icon={!loading ? <Icon size={iconSize} /> : undefined}
            backgroundColor={config.isPrimary ? "$primary" : undefined}
            color={config.isPrimary ? "white" : undefined}
            variant={config.isPrimary ? undefined : "outlined"}
            borderWidth={config.isPrimary ? 0 : 1.5}
            borderRadius="$6"
            onPress={handler}
            disabled={disabled}
            pressStyle={{ opacity: 0.8 }}
          >
            {loading ? (
              <Spinner
                size="small"
                color={config.isPrimary ? "white" : "$color"}
              />
            ) : (
              config.label
            )}
          </Button>
        );
      })}
    </XStack>
  );
};

const useProfileActionButtons = (userId?: string) => {
  const utils = api.useUtils();
  const router = useRouter();
  const [isInvalidatingByAction, setIsInvalidatingByAction] = useState<
    Record<string, boolean>
  >({});

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
        utils.profile.getNetworkRelationships.invalidate({ userId: userId }),
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
