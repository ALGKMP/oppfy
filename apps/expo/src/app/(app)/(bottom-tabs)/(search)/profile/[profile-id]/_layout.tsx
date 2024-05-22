import { useEffect } from "react";
import { Pressable, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useGlobalSearchParams,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { Camera, Grid3x3, MoreHorizontal } from "@tamagui/lucide-icons";
import { Skeleton } from "moti/skeleton";
import {
  Avatar,
  Button,
  Paragraph,
  SizableText,
  Text,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";

import { abbreviateNumber } from "@oppfy/utils";

import { Header } from "~/components/Headers";
import { TopTabBar } from "~/components/TabBars";
import { useProfileContext } from "~/contexts/ProfileContext";
import { useUploadProfilePicture } from "~/hooks/media";
import { TopTabs } from "~/layouts";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

type ProfileData = RouterOutputs["profile"]["getOtherUserFullProfile"];

const ProfileLayout = () => {
  const theme = useTheme();

  const { profileId } = useLocalSearchParams<{ profileId: string }>();

  const { data: profileData, isLoading: _profileDataIsLoading } =
    api.profile.getOtherUserFullProfile.useQuery({
      profileId: Number(profileId),
    });

  return (
    <TopTabs
      tabBar={(props) => (
        <YStack>
          {profileData === undefined ? (
            <Profile loading />
          ) : (
            <Profile loading={false} data={profileData} />
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
        name="media-of-friends-they-posted"
        options={{
          tabBarLabel: () => <Camera />,
        }}
      />
    </TopTabs>
  );
};

interface LoadingProps {
  loading: true;
}

interface LoadedProps {
  loading: false;
  data: ProfileData;
}

type ProfileProps = LoadingProps | LoadedProps;

const Profile = (props: ProfileProps) => {
  const router = useRouter();

  const followUser = api.follow.followUser.useMutation();
  const unfollowUser = api.follow.unfollowUser.useMutation();
  const addFriend = api.friend.sendFriendRequest.useMutation();
  const removeFriend = api.friend.removeFriend.useMutation();

  // TODO: @77zv
  const handleFollow = () => console.log("Follow");
  const handleUnfollow = () => console.log("Unfollow");
  const handleAddFriend = () => console.log("Add Friend");
  const handleRemoveFriend = () => console.log("Remove Friend");
  const handleCancelFollowRequest = () => console.log("Cancel Follow Request");
  const handleCancelFriendRequest = () => console.log("Cancel Friend Request");

  const renderActionButtons = () => {
    if (props.loading) return null;

    const { privacy, currentUserFollowState, currentUserFriendState } =
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
      public_Following_Requested: (
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
      private_Requested_NotFriends: (
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
      private_Requested_Requested: (
        <>
          <Button size="$3" flex={1} onPress={handleCancelFollowRequest}>
            Cancel Follow Request
          </Button>
          <Button size="$3" flex={1} onPress={handleCancelFriendRequest}>
            Cancel Friend Request
          </Button>
        </>
      ),
      private_Following_Requested: (
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

    const key = `${privacy}_${currentUserFollowState}_${currentUserFriendState}`;
    return buttonCombinations[key] || null;
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
              // @ts-ignore
              router.push({
                pathname: "connections/[user-id]",
                params: {
                  userId: props.loading ? "" : props.data.userId,
                  username: props.loading ? "" : props.data.username,
                  initialRouteName: "friends-list",
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
              // @ts-ignore
              router.push({
                pathname: "connections/[user-id]",
                params: {
                  userId: props.loading ? "" : props.data.userId,
                  username: props.loading ? "" : props.data.username,
                  initialRouteName: "followers-list",
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
              // @ts-ignore
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
