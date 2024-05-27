import { useCallback, useLayoutEffect, useState } from "react";
import { RefreshControl, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Camera, Grid3x3 } from "@tamagui/lucide-icons";
import { Skeleton } from "moti/skeleton";
import {
  Avatar,
  Button,
  Paragraph,
  ScrollView,
  SizableText,
  Text,
  useTheme,
  XStack,
  YStack,
} from "tamagui";

import { abbreviateNumber } from "@oppfy/utils";

import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

type ProfileData = RouterOutputs["profile"]["getOtherUserFullProfile"];

interface ProfileDataWithProfileId extends ProfileData {
  profileId: number;
}

const ProfileLayout = () => {
  const theme = useTheme();

  const { profileId } = useLocalSearchParams<{ profileId: string }>();

  const [refreshing, setRefreshing] = useState(false);

  const {
    data: profileData,
    isLoading,
    refetch,
  } = api.profile.getOtherUserFullProfile.useQuery({
    profileId: Number(profileId),
  });

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: profileData?.username,
    });
  }, [navigation, profileData?.username]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <ScrollView
      contentContainerStyle={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <TopTabs
        tabBar={(props) => (
          <YStack>
            {isLoading || profileData === undefined ? (
              <Profile loading />
            ) : (
              <Profile
                loading={false}
                data={{
                  profileId: Number(profileId),
                  ...profileData,
                }}
              />
            )}
            <TopTabBar {...props} />
          </YStack>
        )}
        style={{
          backgroundColor: theme.background.val,
        }}
      >
        <TopTabs.Screen
          name="media-of-them"
          options={{
            tabBarLabel: () => <Grid3x3 />,
          }}
        />
        <TopTabs.Screen
          name="media-of-friends"
          options={{
            tabBarLabel: () => <Camera />,
          }}
        />
      </TopTabs>
    </ScrollView>
  );
};

interface LoadingProps {
  loading: true;
}

interface LoadedProps {
  loading: false;
  data: ProfileDataWithProfileId;
}

type ProfileProps = LoadingProps | LoadedProps;

const Profile = (props: ProfileProps) => {
  const router = useRouter();

  const utils = api.useUtils();

  const followUser = api.follow.followUser.useMutation({
    onMutate: async (_newData) => {
      if (props.loading) return;

      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.profile.getOtherUserFullProfile.cancel();

      // Get the data from the queryCache
      const prevData = utils.profile.getOtherUserFullProfile.getData({
        profileId: props.data.profileId,
      });
      if (prevData === undefined) return;

      utils.profile.getOtherUserFullProfile.setData(
        {
          profileId: props.data.profileId,
        },
        {
          ...prevData,
          followerCount: prevData.followerCount + 1,
          networkStatus:
            prevData.networkStatus.privacy === "public"
              ? {
                  ...prevData.networkStatus,
                  targetUserFollowState: "Following",
                }
              : {
                  ...prevData.networkStatus,
                  targetUserFollowState: "OutboundRequest",
                },
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (props.loading) return;
      if (ctx === undefined) return;

      utils.profile.getOtherUserFullProfile.setData(
        { profileId: props.data.profileId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      if (props.loading) return;

      // Sync with server once mutation has settled
      await utils.profile.getOtherUserFullProfile.invalidate();
    },
  });

  const unfollowUser = api.follow.unfollowUser.useMutation({
    onMutate: async (_newData) => {
      if (props.loading) return;

      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.profile.getOtherUserFullProfile.cancel();

      // Get the data from the queryCache
      const prevData = utils.profile.getOtherUserFullProfile.getData({
        profileId: props.data.profileId,
      });
      if (prevData === undefined) return;

      utils.profile.getOtherUserFullProfile.setData(
        {
          profileId: props.data.profileId,
        },
        {
          ...prevData,
          followerCount: prevData.followerCount - 1,
          networkStatus: {
            ...prevData.networkStatus,
            targetUserFollowState: "NotFollowing",
          },
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (props.loading) return;
      if (ctx === undefined) return;

      utils.profile.getOtherUserFullProfile.setData(
        { profileId: props.data.profileId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      if (props.loading) return;

      // Sync with server once mutation has settled
      await utils.profile.getOtherUserFullProfile.invalidate();
    },
  });

  const addFriend = api.friend.sendFriendRequest.useMutation({
    onMutate: async (_newData) => {
      if (props.loading) return;

      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.profile.getOtherUserFullProfile.cancel();

      // Get the data from the queryCache
      const prevData = utils.profile.getOtherUserFullProfile.getData({
        profileId: props.data.profileId,
      });
      if (prevData === undefined) return;

      utils.profile.getOtherUserFullProfile.setData(
        {
          profileId: props.data.profileId,
        },
        {
          ...prevData,
          networkStatus:
            prevData.networkStatus.targetUserFriendState === "IncomingRequest"
              ? {
                  ...prevData.networkStatus,
                  targetUserFriendState: "Friends",
                }
              : {
                  ...prevData.networkStatus,
                  targetUserFriendState: "OutboundRequest",
                },
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (props.loading) return;
      if (ctx === undefined) return;

      utils.profile.getOtherUserFullProfile.setData(
        { profileId: props.data.profileId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      if (props.loading) return;

      // Sync with server once mutation has settled
      await utils.profile.getOtherUserFullProfile.invalidate();
    },
  });

  const removeFriend = api.friend.removeFriend.useMutation({
    onMutate: async (_newData) => {
      if (props.loading) return;

      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.profile.getOtherUserFullProfile.cancel();

      // Get the data from the queryCache
      const prevData = utils.profile.getOtherUserFullProfile.getData({
        profileId: props.data.profileId,
      });
      if (prevData === undefined) return;

      utils.profile.getOtherUserFullProfile.setData(
        {
          profileId: props.data.profileId,
        },
        {
          ...prevData,
          networkStatus: {
            ...prevData.networkStatus,
            targetUserFriendState: "NotFriends",
          },
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (props.loading) return;
      if (ctx === undefined) return;

      utils.profile.getOtherUserFullProfile.setData(
        { profileId: props.data.profileId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      if (props.loading) return;

      // Sync with server once mutation has settled
      await utils.profile.getOtherUserFullProfile.invalidate();
    },
  });

  const cancelFollowRequest = api.follow.cancelFollowRequest.useMutation({
    onMutate: async (_newData) => {
      if (props.loading) return;

      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.profile.getOtherUserFullProfile.cancel();

      // Get the data from the queryCache
      const prevData = utils.profile.getOtherUserFullProfile.getData({
        profileId: props.data.profileId,
      });
      if (prevData === undefined) return;

      utils.profile.getOtherUserFullProfile.setData(
        {
          profileId: props.data.profileId,
        },
        {
          ...prevData,
          networkStatus: {
            ...prevData.networkStatus,
            targetUserFollowState: "NotFollowing",
          },
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (props.loading) return;
      if (ctx === undefined) return;

      utils.profile.getOtherUserFullProfile.setData(
        { profileId: props.data.profileId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      if (props.loading) return;

      // Sync with server once mutation has settled
      await utils.profile.getOtherUserFullProfile.invalidate();
    },
  });

  const cancelFriendRequest = api.friend.cancelFriendRequest.useMutation({
    onMutate: async (_newData) => {
      if (props.loading) return;

      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.profile.getOtherUserFullProfile.cancel();

      // Get the data from the queryCache
      const prevData = utils.profile.getOtherUserFullProfile.getData({
        profileId: props.data.profileId,
      });
      if (prevData === undefined) return;

      utils.profile.getOtherUserFullProfile.setData(
        {
          profileId: props.data.profileId,
        },
        {
          ...prevData,
          networkStatus: {
            ...prevData.networkStatus,
            targetUserFriendState: "NotFriends",
          },
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (props.loading) return;
      if (ctx === undefined) return;

      utils.profile.getOtherUserFullProfile.setData(
        { profileId: props.data.profileId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      if (props.loading) return;

      // Sync with server once mutation has settled
      await utils.profile.getOtherUserFullProfile.invalidate();
    },
  });

  const handleFollow = async () => {
    if (props.loading) return;

    await followUser.mutateAsync({
      userId: props.data.userId,
    });
  };
  const handleUnfollow = async () => {
    if (props.loading) return;

    await unfollowUser.mutateAsync({
      userId: props.data.userId,
    });
  };

  const handleAddFriend = async () => {
    if (props.loading) return;

    await addFriend.mutateAsync({
      recipientId: props.data.userId,
    });
  };
  const handleRemoveFriend = async () => {
    if (props.loading) return;

    await removeFriend.mutateAsync({
      recipientId: props.data.userId,
    });
  };

  const handleCancelFollowRequest = async () => {
    if (props.loading) return;

    await cancelFollowRequest.mutateAsync({
      userId: props.data.userId,
    });
  };
  const handleCancelFriendRequest = async () => {
    if (props.loading) return;

    await cancelFriendRequest.mutateAsync({
      recipientId: props.data.userId,
    });
  };

  const renderActionButtons = () => {
    if (props.loading) return null;

    const { privacy, targetUserFollowState, targetUserFriendState } =
      props.data.networkStatus;

    const buttonCombinations: Record<string, JSX.Element> = {
      public_NotFollowing_NotFriends: (
        <>
          <Button size="$3" flex={1} onPress={handleFollow}>
            Follow
          </Button>
          <Button size="$3" flex={1} onPress={handleAddFriend}>
            Add Friend
          </Button>
        </>
      ),
      public_Following_NotFriends: (
        <>
          <Button size="$3" flex={1} onPress={handleUnfollow}>
            Unfollow
          </Button>
          <Button size="$3" flex={1} onPress={handleAddFriend}>
            Add Friend
          </Button>
        </>
      ),
      public_Following_OutboundRequest: (
        <>
          <Button size="$3" flex={1} onPress={handleUnfollow}>
            Unfollow
          </Button>
          <Button size="$3" flex={1} onPress={handleCancelFriendRequest}>
            Cancel Friend Request
          </Button>
        </>
      ),
      public_Following_Friends: (
        <>
          <Button size="$3" flex={1} onPress={handleUnfollow}>
            Unfollow
          </Button>
          <Button size="$3" flex={1} onPress={handleRemoveFriend}>
            Remove Friend
          </Button>
        </>
      ),
      private_NotFollowing_NotFriends: (
        <>
          <Button size="$3" flex={1} onPress={handleFollow}>
            Request Follow
          </Button>
          <Button size="$3" flex={1} onPress={handleAddFriend}>
            Add Friend
          </Button>
        </>
      ),
      private_OutboundRequest_NotFriends: (
        <>
          <Button size="$3" flex={1} onPress={handleCancelFollowRequest}>
            Cancel Follow Request
          </Button>
          <Button size="$3" flex={1} onPress={handleAddFriend}>
            Add Friend
          </Button>
        </>
      ),
      private_Following_NotFriends: (
        <>
          <Button size="$3" flex={1} onPress={handleUnfollow}>
            Unfollow
          </Button>
          <Button size="$3" flex={1} onPress={handleAddFriend}>
            Add Friend
          </Button>
        </>
      ),
      private_OutboundRequest_OutboundRequest: (
        <>
          <Button size="$3" flex={1} onPress={handleCancelFollowRequest}>
            Cancel Follow Request
          </Button>
          <Button size="$3" flex={1} onPress={handleCancelFriendRequest}>
            Cancel Friend Request
          </Button>
        </>
      ),
      private_Following_OutboundRequest: (
        <>
          <Button size="$3" flex={1} onPress={handleUnfollow}>
            Unfollow
          </Button>
          <Button size="$3" flex={1} onPress={handleCancelFriendRequest}>
            Cancel Friend Request
          </Button>
        </>
      ),
      private_Following_Friends: (
        <>
          <Button size="$3" flex={1} onPress={handleUnfollow}>
            Unfollow
          </Button>
          <Button size="$3" flex={1} onPress={handleRemoveFriend}>
            Remove Friend
          </Button>
        </>
      ),
    };

    const key = `${privacy}_${targetUserFollowState}_${targetUserFriendState}`;
    return buttonCombinations[key] ?? null;
  };

  return (
    <Skeleton.Group show={props.loading}>
      <YStack
        padding="$4"
        alignItems="center"
        backgroundColor="$background"
        gap="$4"
      >
        <Skeleton radius={100} width={105}>
          <TouchableOpacity
            style={{ alignItems: "center" }}
            disabled={props.loading}
          >
            <Avatar circular size="$10" bordered>
              <Avatar.Image
                {...(props.loading
                  ? {}
                  : { src: props.data.profilePictureUrl })}
              />
              <Avatar.Fallback />
            </Avatar>
          </TouchableOpacity>
        </Skeleton>

        <YStack alignItems="center" gap="$2">
          {props.loading ? (
            <Skeleton width={100} height={25}>
              <SizableText size="$4" textAlign="center" />
            </Skeleton>
          ) : (
            <SizableText size="$4" textAlign="center">
              {props.data.name}
            </SizableText>
          )}

          {props.loading ? (
            <Skeleton width={250} height={50}>
              <Paragraph theme="alt1" textAlign="center" />
            </Skeleton>
          ) : props.data.bio ? (
            <Paragraph theme="alt1" textAlign="center">
              {props.data.bio}
            </Paragraph>
          ) : null}
        </YStack>

        <XStack width={250} gap="$4">
          {renderActionButtons()}
        </XStack>

        <XStack gap="$7">
          <TouchableOpacity
            disabled={props.loading}
            onPress={() =>
              // @ts-expect-error: Experimental typed routes dont support layouts yet
              router.push({
                pathname: "connections/[user-id]",
                params: {
                  userId: props.loading ? "" : props.data.userId,
                  username: props.loading ? "" : props.data.username,
                  initialRouteName: "friend-list",
                },
              })
            }
          >
            <Stat
              label="Friends"
              value={
                props.loading ? "0" : abbreviateNumber(props.data.friendCount)
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            disabled={props.loading}
            onPress={() =>
              // @ts-expect-error: Experimental typed routes dont support layouts yet
              router.push({
                pathname: "connections/[user-id]",
                params: {
                  userId: props.loading ? "" : props.data.userId,
                  username: props.loading ? "" : props.data.username,
                  initialRouteName: "follower-list",
                },
              })
            }
          >
            <Stat
              label="Followers"
              value={
                props.loading ? "0" : abbreviateNumber(props.data.followerCount)
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={props.loading}
            onPress={() =>
              // @ts-expect-error: Experimental typed routes dont support layouts yet
              router.push({
                pathname: "connections/[user-id]",
                params: {
                  userId: props.loading ? "" : props.data.userId,
                  username: props.loading ? "" : props.data.username,
                  initialRouteName: "following-list",
                },
              })
            }
          >
            <Stat
              label="Following"
              value={
                props.loading
                  ? "0"
                  : abbreviateNumber(props.data.followingCount)
              }
            />
          </TouchableOpacity>
        </XStack>
      </YStack>
    </Skeleton.Group>
  );
};

interface StatProps {
  label: string;
  value: string | number;
}

const Stat = (props: StatProps) => (
  <XStack gap="$1">
    <Text>{props.label}</Text>
    <Text>{props.value}</Text>
  </XStack>
);

export default ProfileLayout;
