import { useEffect } from "react";
import { Pressable, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
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
import { useUploadProfilePicture } from "~/hooks/media";
import { TopTabs } from "~/layouts";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type ProfileData = RouterOutputs["profile"]["getCurrentUsersFullProfile"];

const ProfileLayout = () => {
  const theme = useTheme();

  const { data: profileData, isLoading: _profileDataIsLoading } =
    api.profile.getCurrentUsersFullProfile.useQuery();

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
        name="media-of-you"
        options={{
          tabBarLabel: () => <Grid3x3 />,
        }}
      />
      <TopTabs.Screen
        name="media-of-friends-you-posted"
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

  const { imageUri, pickAndUploadImage } = useUploadProfilePicture({
    optimisticallyUpdate: true,
  });

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
            onPress={pickAndUploadImage}
          >
            <Avatar circular size="$10" bordered>
              <Avatar.Image
                {...(props.loading
                  ? {}
                  : { src: imageUri ?? props.data.profilePictureUrl })}
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
            onPress={() => router.push("/share-profile")}
          >
            Share Profile
          </Button>
        </XStack>

        <XStack gap="$7">
          <TouchableOpacity
            disabled={props.loading}
            onPress={() => router.push("/friends-list")}
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
            onPress={() => router.push("/followers-list")}
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
            onPress={() => router.push("/following-list")}
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
