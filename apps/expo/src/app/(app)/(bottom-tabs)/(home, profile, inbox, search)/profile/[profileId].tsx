import React from "react";
import { TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, MoreHorizontal } from "@tamagui/lucide-icons";
import { Text, View, XStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import MediaOfYou from "../../(profile)/MediaOfYou";

const Profile = () => {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();

  // Profile data query
  const {
    data: profileData,
    isLoading: isLoadingProfileData,
    refetch: refetchProfileData,
  } = api.profile.getFullProfileOther.useQuery(
    { userId: userId ?? "" },
    { enabled: !!userId },
  );

  // Friends data query
  const {
    data: friendsData,
    isLoading: isLoadingFriendsData,
    refetch: refetchFriendsData,
  } = api.friend.paginateFriendsOthersByProfileId.useInfiniteQuery(
    { profileId: parseInt(profileId ?? ""), pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!profileId,
    },
  );

  // Posts data query
  const {
    data: postsData,
    isLoading: isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = api.post.paginatePostsOfUserOther.useInfiniteQuery(
    { profileId: parseInt(profileId ?? ""), pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!profileId,
    },
  );

  const posts = postsData?.pages.flatMap((page) => page.items) ?? [];
  const friends = friendsData?.pages.flatMap((page) => page.items) ?? [];

  return (
    <BaseScreenView padding={0}>
      <XStack
        paddingVertical="$2"
        paddingHorizontal="$4"
        alignItems="center"
        justifyContent="space-between"
        backgroundColor="$background"
      >
        {router.canGoBack() ? (
          <View minWidth="$2" alignItems="flex-start">
            <TouchableOpacity onPress={() => router.back()}>
              <ChevronLeft />
            </TouchableOpacity>
          </View>
        ) : (
          <View minWidth="$2" alignItems="flex-start" />
        )}

        <View alignItems="center">
          <Text fontSize="$5" fontWeight="bold">
            Profile
          </Text>
        </View>

        <View minWidth="$2" alignItems="flex-end">
          <TouchableOpacity onPress={() => router.push("/(app)/(settings)")}>
            <MoreHorizontal />
          </TouchableOpacity>
        </View>
      </XStack>
      {profileId && (
        <MediaOfYou
          profileId={profileId}
          isSelfProfile={false}
          profileData={profileData}
          isLoadingProfileData={isLoadingProfileData}
          refetchProfileData={refetchProfileData}
          recommendations={[]} // We don't fetch recommendations for other users
          isLoadingRecommendationsData={false}
          refetchRecommendationsData={() => Promise.resolve()}
          friends={friends}
          isLoadingFriendsData={isLoadingFriendsData}
          refetchFriendsData={refetchFriendsData}
          posts={posts}
          isLoadingPostData={isLoadingPostData}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage ?? false}
        />
      )}
    </BaseScreenView>
  );
};

export default Profile;
