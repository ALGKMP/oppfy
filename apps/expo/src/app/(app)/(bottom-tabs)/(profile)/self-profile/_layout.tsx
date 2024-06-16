import { useCallback, useLayoutEffect, useState } from "react";
import { RefreshControl, TouchableOpacity } from "react-native";
import { useNavigation, useRouter } from "expo-router";
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
import { useUploadProfilePicture } from "~/hooks/media";
import { TopTabs } from "~/layouts";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import MediaOfYou from "./media-of-you";

type ProfileData = RouterOutputs["profile"]["getFullProfileSelf"];

const ProfileLayout = () => {
  const theme = useTheme();
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);

  const {
    data: profileData,
    isLoading,
    refetch,
  } = api.profile.getFullProfileSelf.useQuery();

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
        // contentContainerStyle={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading || profileData === undefined ? (
          <Profile loading />
        ) : (
          <>
            <Profile loading={false} data={profileData} />
            <MediaOfYou />
          </>
        )}
      </ScrollView>
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
            onPress={() => router.push("/self-connections/friend-list")}
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
            onPress={() => router.push("/self-connections/follower-list")}
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
            onPress={() => router.push("/self-connections/following-list")}
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
