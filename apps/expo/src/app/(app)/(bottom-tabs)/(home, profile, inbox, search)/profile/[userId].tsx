import React, { useLayoutEffect } from "react";
import { TouchableOpacity } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { ChevronLeft, MoreHorizontal } from "@tamagui/lucide-icons";
import { Text, View, XStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import MediaOfYou from "../../(profile)/MediaOfYou";

const Profile = () => {
  const router = useRouter();
  const navigation = useNavigation();

  const { userId, username } = useLocalSearchParams<{
    userId: string;
    username: string;
  }>();

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
  } = api.friend.paginateFriendsOthers.useInfiniteQuery(
    { userId: userId ?? "", pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!userId,
    },
  );

  // Posts data query
  const {
    data: postsData,
    isLoading: isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchPosts,
    hasNextPage,
  } = api.post.paginatePostsOfUserOther.useInfiniteQuery(
    { userId: userId ?? "", pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!userId,
    },
  );

  const posts = postsData?.pages.flatMap((page) => page.items) ?? [];
  const friends = friendsData?.pages.flatMap((page) => page.items) ?? [];

  useLayoutEffect(() => {
    navigation.setOptions({
      title: username ?? profileData?.username,
    });
  }, [navigation, username, profileData]);

  return (
    <BaseScreenView padding={0}>
      {/* <XStack
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
      </XStack> */}
      {userId && (
        <MediaOfYou
          userId={userId}
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
          refetchPosts={refetchPosts}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage ?? false}
        />
      )}
    </BaseScreenView>
  );
};

export default Profile;
