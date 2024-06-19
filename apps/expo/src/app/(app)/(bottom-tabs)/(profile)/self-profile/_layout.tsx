import { useCallback, useLayoutEffect, useState } from "react";
import { RefreshControl, TouchableOpacity } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Camera, Grid3x3 } from "@tamagui/lucide-icons";
import { Skeleton } from "moti/skeleton";
import {
  Avatar,
  Button,
  getToken,
  Paragraph,
  ScrollView,
  SizableText,
  Spacer,
  Text,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";

import { abbreviatedNumber } from "@oppfy/utils";

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

  const {
    data: friendData,
    isLoading: isLoadingFriends,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchFriends,
  } = api.friend.paginateFriendsSelf.useInfiniteQuery(
    { pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

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
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {isLoading || profileData === undefined ? (
        <Profile loading />
      ) : (
        <>
          <YStack gap="$5">
            <Profile loading={false} data={profileData} />

            <View
              width="100%"
              paddingVertical="$3"
              borderRadius="$6"
              backgroundColor="$gray2"
            >
              <YStack gap="$2">
                <XStack paddingLeft="$3" gap="$1">
                  <Text fontWeight="700">
                    {abbreviatedNumber(profileData.friendCount)}
                  </Text>
                  <Text fontWeight="600">Friends</Text>
                </XStack>

                <FlashList
                  contentContainerStyle={{
                    paddingHorizontal: getToken("$space.3"),
                  }}
                  data={Array.from({ length: 10 })}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  ItemSeparatorComponent={() => <Spacer size="$2" />}
                  estimatedItemSize={70}
                  renderItem={() => (
                    <YStack gap="$1.5">
                      <Avatar circular size="$6" bordered>
                        <Avatar.Image src={profileData.profilePictureUrl} />
                      </Avatar>
                      <Text fontWeight="600" textAlign="center">
                        {profileData.username}
                      </Text>
                    </YStack>
                  )}
                />
              </YStack>
            </View>

            <MediaOfYou />
          </YStack>
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
        paddingBottom={0}
        alignItems="center"
        backgroundColor="$background"
        gap="$4"
      >
        <View marginBottom={-28}>
          <Skeleton radius={100} width={105}>
            <TouchableOpacity
              style={{ alignItems: "center" }}
              disabled={props.loading}
              onPress={pickAndUploadImage}
            >
              <Avatar circular size="$14" bordered>
                <Avatar.Image
                  {...(props.loading
                    ? {}
                    : { src: imageUri ?? props.data.profilePictureUrl })}
                />
                <Avatar.Fallback />
              </Avatar>
            </TouchableOpacity>
          </Skeleton>
        </View>

        <XStack justifyContent="space-between" alignItems="center" width="100%">
          <YStack alignItems="flex-start" gap="$2">
            {props.loading ? (
              <Skeleton width={100} height={25}>
                <SizableText size="$4" textAlign="left" />
              </Skeleton>
            ) : (
              <SizableText
                size="$5"
                fontWeight="bold"
                textAlign="left"
                lineHeight={0}
              >
                {props.data.name}
              </SizableText>
            )}

            {props.loading ? (
              <Skeleton width={250} height={50}>
                <Paragraph theme="alt1" textAlign="left" />
              </Skeleton>
            ) : props.data.bio ? (
              <Paragraph theme="alt1" textAlign="left" lineHeight={0}>
                {props.data.bio}
              </Paragraph>
            ) : null}
          </YStack>

          <YStack alignItems="flex-end" gap="$2">
            <TouchableOpacity
              disabled={props.loading}
              onPress={() => router.push("/self-connections/following-list")}
            >
              <Stat
                label="Following"
                value={
                  props.loading
                    ? "0"
                    : abbreviatedNumber(props.data.followingCount)
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
                  props.loading
                    ? "0"
                    : abbreviatedNumber(props.data.followerCount)
                }
              />
            </TouchableOpacity>
          </YStack>
        </XStack>

        <XStack gap="$4">
          <Button
            size="$3.5"
            flex={1}
            disabled={props.loading}
            onPress={() => router.push("/edit-profile")}
          >
            Edit Profile
          </Button>
          <Button
            size="$3.5"
            flex={1}
            disabled={props.loading}
            onPress={() => router.push("/share-profile")}
          >
            Share Profile
          </Button>
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
    <Text theme="alt1">{props.label}</Text>
    <Text fontWeight="bold" theme="alt1">
      {props.value}
    </Text>
  </XStack>
);

export default ProfileLayout;
