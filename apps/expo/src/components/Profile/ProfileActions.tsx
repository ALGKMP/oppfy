import { useState } from "react";
import { useRouter } from "expo-router";
import type { IconProps } from "@tamagui/helpers-icon";
import { Edit3, Share2, UserPlus, Users } from "@tamagui/lucide-icons";
import { XStack } from "tamagui";

import { Button } from "~/components/ui";
import { Spinner } from "~/components/ui/Spinner";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

type Icon = React.FC<IconProps>;
type relationshipState =
  RouterOutputs["profile"]["getRelationshipStatesBetweenUsers"];

interface ButtonConfig {
  label: string;
  action: string;
  icon: Icon;
  iconSize?: number;
  isPrimary?: boolean;
}

interface ActionButtonSelfProps {
  type: "self";
  userId: string | undefined;
  isDisabled?: boolean;
}

interface ActionButtonOtherProps {
  type: "other";
  userId: string | undefined;
  relationshipState: relationshipState | undefined;
  isDisabled?: boolean;
}

type ActionButtonProps = ActionButtonSelfProps | ActionButtonOtherProps;

const ActionButton = (props: ActionButtonProps) => {
  const router = useRouter();
  const { actions } = useProfileActionButtons(props.userId);

  if (props.type === "self") {
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
          disabled={props.isDisabled}
          opacity={props.isDisabled ? 0.5 : 1}
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
          disabled={props.isDisabled}
          opacity={props.isDisabled ? 0.5 : 1}
        >
          Share Profile
        </Button>
      </XStack>
    );
  }

  if (props.relationshipState?.isBlocked) {
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

  const { follow, friend, privacy } = props.relationshipState ?? {};

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
      isPrimary: follow === "FOLLOWING" || follow === "REQUESTED",
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

  console.log("RELATIONSHIP STATE", props.relationshipState);

  const buttonCombinations: Record<string, (keyof typeof buttonConfigs)[]> = {
    PUBLIC_NOT_FOLLOWING_NOT_FRIENDS: ["follow", "friend"],
    PUBLIC_FOLLOWING_NOT_FRIENDS: ["unfollow", "friend"],
    PUBLIC_FOLLOWING_REQUESTED: ["cancelFriendRequest"],
    PUBLIC_FOLLOWING_FRIENDS: ["removeFriend"],
    PRIVATE_NOT_FOLLOWING_NOT_FRIENDS: ["follow", "friend"],
    PRIVATE_REQUESTED_NOT_FRIENDS: ["cancelFollowRequest", "friend"],
    PRIVATE_FOLLOWING_NOT_FRIENDS: ["unfollow", "friend"],
    PRIVATE_REQUESTED_REQUESTED: ["cancelFriendRequest"],
  };

  const key = `${privacy}_${follow}_${friend}`;
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

  const removeFriend = api.friend.unfriendUser.useMutation({
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

  const invalidateQueries = (actionKey: string) => {
    if (!userId) return;
    setIsInvalidatingByAction((prev) => ({ ...prev, [actionKey]: true }));

    try {
      void utils.profile.getRelationshipStatesBetweenUsers.invalidate({
        userId,
      });
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
          handler: () =>
            void followUser.mutateAsync({ recipientUserId: userId }),
          loading: followUser.isPending || isInvalidatingByAction.follow,
          disabled: isAnyActionLoading,
        },
        unfollow: {
          handler: () =>
            void unfollowUser.mutateAsync({ recipientUserId: userId }),
          loading: unfollowUser.isPending || isInvalidatingByAction.unfollow,
          disabled: isAnyActionLoading,
        },
        addFriend: {
          handler: () =>
            void addFriend.mutateAsync({ recipientUserId: userId }),
          loading: addFriend.isPending || isInvalidatingByAction.addFriend,
          disabled: isAnyActionLoading,
        },
        removeFriend: {
          handler: () =>
            void removeFriend.mutateAsync({ recipientUserId: userId }),
          loading:
            removeFriend.isPending || isInvalidatingByAction.removeFriend,
          disabled: isAnyActionLoading,
        },
        cancelFollowRequest: {
          handler: () =>
            void cancelFollowRequest.mutateAsync({ recipientUserId: userId }),
          loading:
            cancelFollowRequest.isPending ||
            isInvalidatingByAction.cancelFollowRequest,
          disabled: isAnyActionLoading,
        },
        cancelFriendRequest: {
          handler: () =>
            void cancelFriendRequest.mutateAsync({ recipientUserId: userId }),
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
