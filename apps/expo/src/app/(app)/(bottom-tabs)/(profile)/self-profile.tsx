import React from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MoreHorizontal } from "@tamagui/lucide-icons";
import { Text, View, XStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import MediaOfYou from "./MediaOfYou";

const SelfProfile = () => {
  const router = useRouter();
  const utils = api.useUtils();

  // Profile data query
  // const {
  //   data: profileData,
  //   isLoading: isLoadingProfileData,
  //   refetch: refetchProfileData,
  // } = api.profile.getFullProfileSelf.useQuery();

  const profileData = utils.profile.getFullProfileSelf.getData();

  // Recommendations data query
  const {
    data: recommendationsData,
    isLoading: isLoadingRecommendationsData,
    refetch: refetchRecommendationsData,
  } = api.contacts.getRecommendationProfilesSelf.useQuery();

  // Friends data query
  const {
    data: friendsData,
    isLoading: isLoadingFriendsData,
    refetch: refetchFriendsData,
  } = api.friend.paginateFriendsSelf.useInfiniteQuery(
    { pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  // Posts data query
  const {
    data: postsData,
    isLoading: isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = api.post.paginatePostsOfUserSelf.useInfiniteQuery(
    { pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const posts = postsData?.pages.flatMap((page) => page.items) ?? [];
  const friends = friendsData?.pages.flatMap((page) => page.items) ?? [];

  return (
    <BaseScreenView padding={0} safeAreaEdges={["top"]}>
      <XStack
        paddingVertical="$2"
        paddingHorizontal="$4"
        alignItems="center"
        justifyContent="space-between"
        backgroundColor="$background"
      >
        <View minWidth="$2" alignItems="flex-start" />

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
      {
        // MediaOfYou component
        <MediaOfYou
          isSelfProfile={true}
          profileData={profileData}
          isLoadingProfileData={false}
          refetchProfileData={() => utils.profile.getFullProfileSelf.refetch()}
          recommendations={recommendationsData ?? []}
          isLoadingRecommendationsData={isLoadingRecommendationsData}
          refetchRecommendationsData={refetchRecommendationsData}
          friends={friends}
          isLoadingFriendsData={isLoadingFriendsData}
          refetchFriendsData={refetchFriendsData}
          posts={posts}
          isLoadingPostData={isLoadingPostData}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage ?? false}
        />
      }
    </BaseScreenView>
  );
};

export default SelfProfile;
