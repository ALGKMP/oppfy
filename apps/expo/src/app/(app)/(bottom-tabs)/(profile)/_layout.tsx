import { useEffect } from "react";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
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

import { Header } from "~/components/Headers";
import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type ProfileData = RouterOutputs["profile"]["getFullProfile"];

const ProfileLayout = () => {
  const router = useRouter();

  const { data: profileData, isLoading: _profileDataIsLoading } =
    api.profile.getFullProfile.useQuery({
      userId: "OZK0Mq45uIY75FaZdI2OdUkg5Cx1",
    });

  useEffect(() => {
    console.log(profileData);
  }, [profileData]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "$background",
      }}
    >
      <TopTabs
        tabBar={(props) => (
          <YStack>
            <Header
              title={`@${profileData?.username}`}
              HeaderRight={
                <Pressable onPress={() => router.push("/(app)/(settings)")}>
                  {({ pressed }) => (
                    <MoreHorizontal
                      size="$1"
                      style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              }
            />

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
          name="media-of-you"
          options={{
            tabBarLabel: () => <Grid3x3 />,
          }}
        />
        <TopTabs.Screen
          name="media-of-friends-you-posted"
          options={{
            title: "Test",
            tabBarLabel: () => <Camera />,
          }}
        />
      </TopTabs>
    </View>
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

  const editProfileRedirect = () => {
    if (props.loading) return;

    const { name, username, bio } = props.data;

    router.push({
      params: {
        name,
        username,
        bio: bio ?? "",
      },
      pathname: "/edit-profile",
    });
  };

  const shareProfileRedirect = () => {
    if (props.loading) return;

    router.push("/share-profile");
  };

  return (
    <YStack
      padding="$4"
      alignItems="center"
      backgroundColor="$background"
      gap="$4"
    >
      <Avatar circular size="$10">
        <Avatar.Image
          accessibilityLabel="Cam"
          src={props.loading ? undefined : props.data.profilePictureUrl}
        />
        <Avatar.Fallback backgroundColor="$blue10" />
      </Avatar>

      <YStack alignItems="center">
        <SizableText size="$4">
          {props.loading ? "" : props.data.name}
        </SizableText>
        <Paragraph theme="alt1">
          {props.loading ? "" : `@${props.data.username}`}
        </Paragraph>
      </YStack>

      <XStack gap="$4">
        <Button
          size="$3"
          disabled={props.loading}
          onPress={editProfileRedirect}
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
        <Stat
          label="Friends"
          value={props.loading ? "" : props.data.friendCount}
        />
        <Stat
          label="Followers"
          value={props.loading ? "" : props.data.followerCount}
        />
        <Stat
          label="Following"
          value={props.loading ? "" : props.data.followingCount}
        />
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
