import { useEffect } from "react";
import { Pressable, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera, Grid3x3, MoreHorizontal } from "@tamagui/lucide-icons";
import {
  Avatar,
  Button,
  Paragraph,
  SizableText,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import { abbreviateNumber } from "@oppfy/utils";

import { Header } from "~/components/Headers";
import { TopTabBar } from "~/components/TabBars";
import { useUploadProfilePic } from "~/hooks/media";
import { TopTabs } from "~/layouts";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type ProfileData = RouterOutputs["profile"]["getCurrentUsersFullProfile"];

const ProfileLayout = () => {
  const initialData = useLocalSearchParams<{
    profileId: string;
    fullName: string;
    username: string;
    bio: string;
    profilePictureUrl: string;
  }>();

  const { data: profileData, isLoading: _profileDataIsLoading } =
    api.profile.getOtherUserFullProfile.useQuery({
      profileId: 1
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

  const { imageUri, pickAndUploadImage } = useUploadProfilePic({
    optimisticallyUpdate: true,
  });

  return (
    <YStack
      padding="$4"
      alignItems="center"
      backgroundColor="$background"
      gap="$4"
    >
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

      <YStack alignItems="center">
        <SizableText size="$4">
          {props.loading ? "" : props.data.name}
        </SizableText>
        <Paragraph theme="alt1">
          {props.loading ? "" : props.data.bio}
        </Paragraph>
      </YStack>

      <XStack gap="$4">
        <Button
          size="$3"
          disabled={props.loading}
          onPress={() => router.push("/edit-profile")}
        >
          Edit Profile
        </Button>
        <Button
          size="$3"
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
              props.loading ? "" : abbreviateNumber(props.data.friendCount)
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
              props.loading ? "" : abbreviateNumber(props.data.followerCount)
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
              props.loading ? "" : abbreviateNumber(props.data.followingCount)
            }
          />
        </TouchableOpacity>
      </XStack>
    </YStack>
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
