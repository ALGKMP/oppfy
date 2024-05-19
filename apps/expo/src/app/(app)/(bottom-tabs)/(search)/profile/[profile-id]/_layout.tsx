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
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

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
      sceneContainerStyle={{ backgroundColor: theme.background.val }}
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
          <Skeleton width={100} height={25}>
            <SizableText size="$4" textAlign="center">
              {props.loading ? "" : props.data.name}
            </SizableText>
          </Skeleton>

          {!props.loading && props.data.bio && (
            <Skeleton width={250} height={50}>
              <Paragraph theme="alt1" textAlign="center">
                {props.loading ? "" : props.data.bio}
              </Paragraph>
            </Skeleton>
          )}
        </YStack>

        <XStack width={250} gap="$4">
          <Button
            size="$3"
            flex={1}
            disabled={props.loading}
            onPress={() => router.push("/edit-profile")}
          >
            Edit Profile
          </Button>
          <Button
            size="$3"
            flex={1}
            disabled={props.loading}
            onPress={() =>
              router.navigate({
                pathname: "connections/[user-id]",
                params: {
                  userId: props.loading ? "" : props.data.userId,
                },
              })
            }
          >
            Share Profile
          </Button>
        </XStack>

        <XStack gap="$7">
          <TouchableOpacity
            disabled={props.loading}
            // onPress={() => router.push("/friends-list")}
            onPress={() =>
              router.push<{
                userId: string;
                initialRouteName: string;
              }>({
                pathname: "connections/[user-id]",
                params: {
                  userId: props.loading ? "" : props.data.userId,
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
            // onPress={() => router.push("/followers-list")}
            onPress={() =>
              router.push({
                pathname: "connections/[user-id]",
                params: {
                  userId: props.loading ? "" : props.data.userId,
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
              router.push({
                pathname: "connections/[user-id]",
                params: {
                  userId: props.loading ? "" : props.data.userId,
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
