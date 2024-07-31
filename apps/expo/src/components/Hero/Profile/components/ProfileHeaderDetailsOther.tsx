import { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter, useSegments } from "expo-router";
import { UserPlus2, UserRoundCheck } from "@tamagui/lucide-icons";
import {
  Adapt,
  Avatar,
  Button,
  Paragraph,
  Popover,
  SizableText,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import { abbreviatedNumber } from "@oppfy/utils";

import { Skeleton } from "~/components/Skeletons";
import StatusRenderer from "~/components/StatusRenderer";
import { useSession } from "~/contexts/SessionContext";
import { useUploadProfilePicture } from "~/hooks/media";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type ProfileData = RouterOutputs["profile"]["getFullProfileOther"];

interface LoadingProps {
  loading: true;
}

interface ProfileLoadedProps {
  loading: false;
  data: ProfileData;
  isRestricted: boolean;
}
type ProfileProps = LoadingProps | ProfileLoadedProps;

const ProfileHeaderDetailsOther = (props: ProfileProps) => {
  const router = useRouter();
  const { user } = useSession();
  const segments = useSegments();
  const currentSegment = segments[segments.length - 3];
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isFriendLoading, setIsFriendLoading] = useState(false);

  const { pickAndUploadImage } = useUploadProfilePicture({
    optimisticallyUpdate: true,
  });

  const onFollowingListPress = () => {
    if (props.loading || (props.isRestricted && !props.loading)) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.navigate({
      pathname: `${currentSegment}/profile/connections/[user-id]/following-list`,
      params: { userId: props.data.userId, username: props.data.username },
    });
  };

  const onFollowerListPress = () => {
    if (props.loading || (props.isRestricted && !props.loading)) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.navigate({
      pathname: `${currentSegment}/profile/connections/[user-id]/followers-list`,
      params: { userId: props.data.userId, username: props.data.username },
    });
  };

  const onFollowPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (props.loading) return;

    if (props.data.networkStatus.targetUserFollowState === "Following") {
      void handleUnfollow();
    } else if (
      props.data.networkStatus.targetUserFollowState === "NotFollowing"
    ) {
      void handleFollow();
    } else if (
      props.data.networkStatus.targetUserFollowState === "OutboundRequest"
    ) {
      void handleCancelFollowRequest();
    }
  };

  const onFriendPress = (action?: "accept" | "reject") => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (props.loading) return;

    if (props.data.networkStatus.targetUserFriendState === "Friends") {
      void handleRemoveFriend();
    } else if (
      props.data.networkStatus.targetUserFriendState === "NotFriends"
    ) {
      void handleAddFriend();
    } else if (
      props.data.networkStatus.targetUserFriendState === "OutboundRequest"
    ) {
      void handleCancelFriendRequest();
    } else {
      if (action === "accept") {
        void handleAcceptFriendRequest();
      } else if (action === "reject") {
        void handleRejectFriendRequest();
      }
    }
  };

  const utils = api.useUtils();

  const followUser = api.follow.followUser.useMutation({
    // onMutate: async (_newData) => {
    //   if (props.loading) return;

    //   // Cancel outgoing fetches (so they don't overwrite our optimistic update)
    //   await utils.profile.getFullProfileOther.cancel();

    //   // Get the data from the queryCache
    //   const prevData = utils.profile.getFullProfileOther.getData({
    //     userId: props.data.userId,
    //   });
    //   if (prevData === undefined) return;

    //   utils.profile.getFullProfileOther.setData(
    //     {
    //       userId: props.data.userId,
    //     },
    //     {
    //       ...prevData,
    //       followerCount: prevData.followerCount + 1,
    //       networkStatus:
    //         prevData.networkStatus.privacy === "public"
    //           ? {
    //               ...prevData.networkStatus,
    //               targetUserFollowState: "Following",
    //             }
    //           : {
    //               ...prevData.networkStatus,
    //               targetUserFollowState: "OutboundRequest",
    //             },
    //     },
    //   );

    //   return { prevData };
    // },
    // onError: (_err, _newData, ctx) => {
    //   if (props.loading) return;
    //   if (ctx === undefined) return;

    //   utils.profile.getFullProfileOther.setData(
    //     { userId: props.data.userId },
    //     ctx.prevData,
    //   );
    // },
    onSettled: async () => {
      if (props.loading) return;

      // Sync with server once mutation has settled
      await utils.profile.getFullProfileOther.invalidate();
    },
  });

  const unfollowUser = api.follow.unfollowUser.useMutation({
    // onMutate: async (_newData) => {
    //   if (props.loading) return;

    //   // Cancel outgoing fetches (so they don't overwrite our optimistic update)
    //   await utils.profile.getFullProfileOther.cancel();

    //   // Get the data from the queryCache
    //   const prevData = utils.profile.getFullProfileOther.getData({
    //     userId: props.data.userId,
    //   });
    //   if (prevData === undefined) return;

    //   utils.profile.getFullProfileOther.setData(
    //     {
    //       userId: props.data.userId,
    //     },
    //     {
    //       ...prevData,
    //       followerCount: prevData.followerCount - 1,
    //       networkStatus: {
    //         ...prevData.networkStatus,
    //         targetUserFollowState: "NotFollowing",
    //       },
    //     },
    //   );

    //   return { prevData };
    // },
    // onError: (_err, _newData, ctx) => {
    //   if (props.loading) return;
    //   if (ctx === undefined) return;

    //   utils.profile.getFullProfileOther.setData(
    //     { userId: props.data.userId },
    //     ctx.prevData,
    //   );
    // },
    onSettled: async () => {
      if (props.loading) return;

      // Sync with server once mutation has settled
      await utils.profile.getFullProfileOther.invalidate();
    },
  });

  const addFriend = api.friend.sendFriendRequest.useMutation({
    // onMutate: async (_newData) => {
    //   if (props.loading) return;

    //   // Cancel outgoing fetches (so they don't overwrite our optimistic update)
    //   await utils.profile.getFullProfileOther.cancel();

    //   // Get the data from the queryCache
    //   const prevData = utils.profile.getFullProfileOther.getData({
    //     userId: props.data.userId,
    //   });
    //   if (prevData === undefined) return;

    //   utils.profile.getFullProfileOther.setData(
    //     {
    //       userId: props.data.userId,
    //     },
    //     {
    //       ...prevData,
    //       networkStatus:
    //         prevData.networkStatus.targetUserFriendState === "IncomingRequest"
    //           ? {
    //               ...prevData.networkStatus,
    //               targetUserFriendState: "Friends",
    //             }
    //           : {
    //               ...prevData.networkStatus,
    //               targetUserFriendState: "OutboundRequest",
    //             },
    //     },
    //   );

    //   return { prevData };
    // },
    // onError: (_err, _newData, ctx) => {
    //   if (props.loading) return;
    //   if (ctx === undefined) return;

    //   utils.profile.getFullProfileOther.setData(
    //     { userId: props.data.userId },
    //     ctx.prevData,
    //   );
    // },
    onSettled: async () => {
      if (props.loading) return;

      // Sync with server once mutation has settled
      await utils.profile.getFullProfileOther.invalidate();
    },
  });

  const removeFriend = api.friend.removeFriend.useMutation({
    // onMutate: async (_newData) => {
    //   if (props.loading) return;

    //   // Cancel outgoing fetches (so they don't overwrite our optimistic update)
    //   await utils.profile.getFullProfileOther.cancel();

    //   // Get the data from the queryCache
    //   const prevData = utils.profile.getFullProfileOther.getData({
    //     userId: props.data.userId,
    //   });
    //   if (prevData === undefined) return;

    //   utils.profile.getFullProfileOther.setData(
    //     {
    //       userId: props.data.userId,
    //     },
    //     {
    //       ...prevData,
    //       networkStatus: {
    //         ...prevData.networkStatus,
    //         targetUserFriendState: "NotFriends",
    //       },
    //     },
    //   );

    //   return { prevData };
    // },
    // onError: (_err, _newData, ctx) => {
    //   if (props.loading) return;
    //   if (ctx === undefined) return;

    //   utils.profile.getFullProfileOther.setData(
    //     { userId: props.data.userId },
    //     ctx.prevData,
    //   );
    // },
    onSettled: async () => {
      if (props.loading) return;

      // Sync with server once mutation has settled
      await utils.profile.getFullProfileOther.invalidate();
    },
  });

  const cancelFollowRequest = api.request.cancelFollowRequest.useMutation({
    // onMutate: async (_newData) => {
    //   if (props.loading) return;

    //   // Cancel outgoing fetches (so they don't overwrite our optimistic update)
    //   await utils.profile.getFullProfileOther.cancel();

    //   // Get the data from the queryCache
    //   const prevData = utils.profile.getFullProfileOther.getData({
    //     userId: props.data.userId,
    //   });
    //   if (prevData === undefined) return;

    //   utils.profile.getFullProfileOther.setData(
    //     {
    //       userId: props.data.userId,
    //     },
    //     {
    //       ...prevData,
    //       networkStatus: {
    //         ...prevData.networkStatus,
    //         targetUserFollowState: "NotFollowing",
    //       },
    //     },
    //   );

    //   return { prevData };
    // },
    // onError: (_err, _newData, ctx) => {
    //   if (props.loading) return;
    //   if (ctx === undefined) return;

    //   utils.profile.getFullProfileOther.setData(
    //     { userId: props.data.userId },
    //     ctx.prevData,
    //   );
    // },
    onSettled: async () => {
      if (props.loading) return;

      // Sync with server once mutation has settled
      await utils.profile.getFullProfileOther.invalidate();
    },
  });

  const cancelFriendRequest = api.friend.cancelFriendRequest.useMutation({
    // onMutate: async (_newData) => {
    //   if (props.loading) return;

    //   // Cancel outgoing fetches (so they don't overwrite our optimistic update)
    //   await utils.profile.getFullProfileOther.cancel();

    //   // Get the data from the queryCache
    //   const prevData = utils.profile.getFullProfileOther.getData({
    //     userId: props.data.userId,
    //   });
    //   if (prevData === undefined) return;

    //   utils.profile.getFullProfileOther.setData(
    //     {
    //       userId: props.data.userId,
    //     },
    //     {
    //       ...prevData,
    //       networkStatus: {
    //         ...prevData.networkStatus,
    //         targetUserFriendState: "NotFriends",
    //       },
    //     },
    //   );

    //   return { prevData };
    // },
    // onError: (_err, _newData, ctx) => {
    //   if (props.loading) return;
    //   if (ctx === undefined) return;

    //   utils.profile.getFullProfileOther.setData(
    //     { userId: props.data.userId },
    //     ctx.prevData,
    //   );
    // },
    onSettled: async () => {
      if (props.loading) return;

      // Sync with server once mutation has settled
      await utils.profile.getFullProfileOther.invalidate();
    },
  });

  const acceptFriendRequest = api.request.acceptFriendRequest.useMutation({
    // onMutate: async (_newData) => {
    //   if (props.loading) return;

    //   // Cancel outgoing fetches (so they don't overwrite our optimistic update)
    //   await utils.profile.getFullProfileOther.cancel();

    //   // Get the data from the queryCache
    //   const prevData = utils.profile.getFullProfileOther.getData({
    //     userId: props.data.userId,
    //   });
    //   if (prevData === undefined) return;

    //   // Optimistically update the data
    //   utils.profile.getFullProfileOther.setData(
    //     {
    //       userId: props.data.userId,
    //     },
    //     {
    //       ...prevData,
    //       networkStatus: {
    //         ...prevData.networkStatus,
    //         targetUserFriendState: "Friends",
    //         targetUserFollowState: "Following",
    //       },
    //     },
    //   );

    //   return { prevData };
    // },
    // onError: (_err, _newData, ctx) => {
    //   if (props.loading) return;
    //   if (ctx === undefined) return;

    //   utils.profile.getFullProfileOther.setData(
    //     { userId: props.data.userId },
    //     ctx.prevData,
    //   );
    // },
    onSettled: async () => {
      if (props.loading) return;

      // Sync with server once mutation has settled
      await utils.profile.getFullProfileOther.invalidate();
    },
  });

  const declineFriendRequest = api.request.declineFriendRequest.useMutation({
    // onMutate: async (_newData) => {
    //   if (props.loading) return;

    //   // Cancel outgoing fetches (so they don't overwrite our optimistic update)
    //   await utils.profile.getFullProfileOther.cancel();

    //   // Get the data from the queryCache
    //   const prevData = utils.profile.getFullProfileOther.getData({
    //     userId: props.data.userId,
    //   });
    //   if (prevData === undefined) return;

    //   // Optimistically update the data
    //   utils.profile.getFullProfileOther.setData(
    //     {
    //       userId: props.data.userId,
    //     },
    //     {
    //       ...prevData,
    //       networkStatus: {
    //         ...prevData.networkStatus,
    //         targetUserFriendState: "NotFriends",
    //       },
    //     },
    //   );

    //   return { prevData };
    // },
    // onError: (_err, _newData, ctx) => {
    //   if (props.loading) return;
    //   if (ctx === undefined) return;

    //   utils.profile.getFullProfileOther.setData(
    //     { userId: props.data.userId },
    //     ctx.prevData,
    //   );
    // },
    onSettled: async () => {
      if (props.loading) return;

      // Sync with server once mutation has settled
      await utils.profile.getFullProfileOther.invalidate();
    },
  });

  const handleFollow = async () => {
    if (props.loading) return;
    setIsFollowLoading(true);
    try {
      await followUser.mutateAsync({
        userId: props.data.userId,
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (props.loading) return;
    setIsFollowLoading(true);
    try {
      await unfollowUser.mutateAsync({
        userId: props.data.userId,
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (props.loading) return;
    setIsFriendLoading(true);
    try {
      await addFriend.mutateAsync({
        recipientId: props.data.userId,
      });
    } finally {
      setIsFriendLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (props.loading) return;
    setIsFriendLoading(true);
    try {
      await removeFriend.mutateAsync({
        recipientId: props.data.userId,
      });
    } finally {
      setIsFriendLoading(false);
    }
  };

  const handleCancelFollowRequest = async () => {
    if (props.loading) return;
    setIsFollowLoading(true);
    try {
      await cancelFollowRequest.mutateAsync({
        recipientId: props.data.userId,
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleCancelFriendRequest = async () => {
    if (props.loading) return;
    setIsFriendLoading(true);
    try {
      await cancelFriendRequest.mutateAsync({
        recipientId: props.data.userId,
      });
    } finally {
      setIsFriendLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (props.loading) return;
    setIsFriendLoading(true);
    try {
      await acceptFriendRequest.mutateAsync({
        senderId: props.data.userId,
      });
    } finally {
      setIsFriendLoading(false);
    }
  };

  const handleRejectFriendRequest = async () => {
    if (props.loading) return;
    setIsFriendLoading(true);
    try {
      await declineFriendRequest.mutateAsync({
        senderId: props.data.userId,
      });
    } finally {
      setIsFriendLoading(false);
    }
  };

  return (
    <YStack
      padding="$4"
      paddingBottom={0}
      alignItems="center"
      backgroundColor="$background"
      gap="$4"
    >
      <View alignItems="center" marginBottom={-30}>
        <StatusRenderer
          data={!props.loading ? props.data : undefined}
          loadingComponent={<Skeleton circular size={160} />}
          successComponent={(profileData) => (
            <>
              {user?.uid === profileData.userId ? (
                <TouchableOpacity onPress={pickAndUploadImage}>
                  <Avatar circular size={160} bordered>
                    <Avatar.Image src={profileData.profilePictureUrl} />
                    <Avatar.Fallback />
                  </Avatar>
                </TouchableOpacity>
              ) : (
                <Avatar circular size={160} bordered>
                  <Avatar.Image src={profileData.profilePictureUrl} />
                  <Avatar.Fallback />
                </Avatar>
              )}
            </>
          )}
        />
      </View>

      <XStack justifyContent="space-between" alignItems="center" width="100%">
        <YStack alignItems="flex-start" gap="$2">
          <StatusRenderer
            data={!props.loading ? props.data.name : undefined}
            loadingComponent={<Skeleton width={80} height={20} />}
            successComponent={(name) => (
              <SizableText
                size="$5"
                fontWeight="bold"
                textAlign="left"
                lineHeight={0}
              >
                {name}
              </SizableText>
            )}
          />

          {!props.loading && props.data.bio && (
            <StatusRenderer
              data={props.data.bio}
              loadingComponent={<Skeleton width={150} height={20} />}
              successComponent={(bio) => (
                <Paragraph theme="alt1" textAlign="left" lineHeight={0}>
                  {bio}
                </Paragraph>
              )}
            />
          )}
        </YStack>

        <YStack alignItems="flex-end" gap="$2">
          <StatusRenderer
            data={!props.loading ? props.data.followingCount : undefined}
            loadingComponent={<Skeleton width={80} height={20} />}
            successComponent={(count) => (
              <TouchableOpacity
                onPress={onFollowingListPress}
                disabled={!props.loading ? props.isRestricted : true}
              >
                <Stat label="Following" value={abbreviatedNumber(count)} />
              </TouchableOpacity>
            )}
          />

          <StatusRenderer
            data={!props.loading ? props.data.followerCount : undefined}
            loadingComponent={<Skeleton width={150} height={20} />}
            successComponent={(count) => (
              <TouchableOpacity
                onPress={onFollowerListPress}
                disabled={!props.loading ? props.isRestricted : true}
              >
                <Stat label="Followers" value={abbreviatedNumber(count)} />
              </TouchableOpacity>
            )}
          />
        </YStack>
      </XStack>

      <XStack gap="$4">
        <StatusRenderer
          data={!props.loading ? props.data : undefined}
          loadingComponent={
            <View flex={1}>
              <Skeleton width="100%" height={44} radius={20} />
            </View>
          }
          successComponent={(profileData) => (
            <FollowButton
              networkStatus={profileData.networkStatus}
              onFollowPress={onFollowPress}
              isLoadingFollow={isFollowLoading}
              isLoadingFriend={isFriendLoading}
            />
          )}
        />
        <StatusRenderer
          data={!props.loading ? props.data.networkStatus : undefined}
          loadingComponent={
            <View flex={1}>
              <Skeleton width="100%" height={44} radius={20} />
            </View>
          }
          successComponent={(networkStatus) => (
            <FriendButton
              networkStatus={networkStatus}
              onFriendPress={onFriendPress}
              isLoadingFriend={isFriendLoading}
              isLoadingFollow={isFollowLoading}
            />
          )}
        />
      </XStack>
    </YStack>
  );
};

interface StatProps {
  label: string;
  value: string | number;
}

interface StatProps {
  label: string;
  value: string | number;
}

const Stat = (props: StatProps) => (
  <XStack gap="$1">
    <Text theme="alt1" lineHeight={0}>
      {props.label}{" "}
    </Text>
    <Text fontWeight="bold" lineHeight={0}>
      {props.value}
    </Text>
  </XStack>
);

const FollowButton = ({
  networkStatus,
  onFollowPress,
  isLoadingFollow,
  isLoadingFriend,
}: {
  networkStatus: ProfileData["networkStatus"];
  onFollowPress: () => void;
  isLoadingFollow: boolean;
  isLoadingFriend: boolean;
}) => {
  const followState = networkStatus.targetUserFollowState;
  const friendState = networkStatus.targetUserFriendState;
  const isDisabled =
    (networkStatus.privacy === "private" &&
      friendState === "OutboundRequest") ||
    friendState === "Friends" ||
    friendState === "OutboundRequest";

  if (isDisabled) {
    return null;
  }

  let buttonText: string;
  switch (followState) {
    case "Following":
      buttonText = "Unfollow";
      break;
    case "OutboundRequest":
      buttonText = "Cancel Request";
      break;
    case "NotFollowing":
    default:
      buttonText = "Follow";
      break;
  }

  return (
    <Button
      flex={1}
      borderRadius={20}
      onPress={onFollowPress}
      backgroundColor={followState === "NotFollowing" ? "#F214FF" : "$primary"}
      disabled={isLoadingFollow || isLoadingFriend}
    >
      <XStack gap="$2" alignItems="center">
        <Text>{buttonText}</Text>
        {isLoadingFollow && <Spinner size="small" color="$color" />}
      </XStack>
    </Button>
  );
};

const FriendButton = ({
  networkStatus,
  onFriendPress,
  isLoadingFriend,
  isLoadingFollow,
}: {
  networkStatus: ProfileData["networkStatus"];
  onFriendPress: (action?: "accept" | "reject") => void;
  isLoadingFriend: boolean;
  isLoadingFollow: boolean;
}) => {
  const friendState = networkStatus.targetUserFriendState;
  if (networkStatus.targetUserFriendState === "IncomingRequest") {
    return (
      <Popover size="$5" allowFlip={true}>
        <Popover.Trigger asChild>
          <Button flex={1} borderRadius={20}>
            Respond to Request
          </Button>
        </Popover.Trigger>

        <Popover.Content
          borderWidth={1}
          borderColor="$borderColor"
          enterStyle={{ y: -10, opacity: 0 }}
          exitStyle={{ y: -10, opacity: 0 }}
          elevate
          animation={[
            "quick",
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
        >
          <Popover.Arrow borderWidth={1} borderColor="$borderColor" />

          <XStack gap="$2">
            <Button
              onPress={() => {
                onFriendPress("accept");
              }}
            >
              Accept
            </Button>
            <Button
              onPress={() => {
                onFriendPress("reject");
              }}
            >
              Reject
            </Button>
          </XStack>
        </Popover.Content>
      </Popover>
    );
  }

  return (
    <Button
      flex={1}
      borderRadius={20}
      onPress={() => onFriendPress()}
      backgroundColor={friendState === "NotFriends" ? "#F214FF" : "$primary"}
      disabled={isLoadingFriend || isLoadingFollow}
    >
      <XStack gap="$2" alignItems="center">
        <Text>
          {networkStatus.targetUserFriendState === "Friends"
            ? "Remove Friend"
            : networkStatus.targetUserFriendState === "OutboundRequest"
              ? "Cancel Friend Request"
              : "Add Friend"}
        </Text>
        {isLoadingFriend && <Spinner size="small" color="$color" />}
      </XStack>
    </Button>
  );
};

export default ProfileHeaderDetailsOther;
