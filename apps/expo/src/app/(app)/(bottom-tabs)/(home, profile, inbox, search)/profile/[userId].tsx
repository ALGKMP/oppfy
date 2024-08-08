import React, { useCallback, useEffect, useLayoutEffect } from "react";
import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import {
  useLocalSearchParams,
  useNavigation,
  useRouter,
  useSegments,
} from "expo-router";
import { MoreHorizontal } from "@tamagui/lucide-icons";
import { fromPairs } from "lodash";
import { View } from "tamagui";

import { ActionSheet } from "~/components/Sheets";
import type { ButtonOption } from "~/components/Sheets";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import MediaOfYou from "../../(profile)/MediaOfYou";

const Profile = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const [isActionSheetVisible, setIsActionSheetVisible] = React.useState(false);
  const utils = api.useUtils();
  const segments = useSegments();

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

  // block user
  const blockUser = api.block.blockUser.useMutation({
    onMutate: async () => {
      await utils.profile.getFullProfileOther.cancel();

      if (!userId) return;

      const prevData = utils.profile.getFullProfileOther.getData({
        userId: userId,
      });

      if (prevData === undefined || !userId) {
        console.log(prevData === undefined);
        return;
      }

      utils.profile.getFullProfileOther.setData(
        {
          userId: userId,
        },
        {
          ...prevData,
          networkStatus: {
            ...prevData.networkStatus,
            isTargetUserBlocked: true,
          },
        },
      );
      console.log("Done optimistic shit");

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (isLoadingProfileData || !userId) return;
      if (ctx === undefined) return;

      utils.profile.getFullProfileOther.setData(
        { userId: userId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      if (isLoadingProfileData || !userId) return;

      // Sync with server once mutation has settled
      await utils.profile.getFullProfileOther.invalidate();
    },
  });

  const unblockUser = api.block.unblockUser.useMutation({
    onMutate: async () => {
      await utils.profile.getFullProfileOther.cancel();

      if (!userId) return;

      const prevData = utils.profile.getFullProfileOther.getData({
        userId: userId,
      });

      if (prevData === undefined) return;

      utils.profile.getFullProfileOther.setData(
        {
          userId: userId,
        },
        {
          ...prevData,
          networkStatus: {
            ...prevData.networkStatus,
            isTargetUserBlocked: false,
          },
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (isLoadingProfileData || !userId) return;
      if (ctx === undefined) return;

      utils.profile.getFullProfileOther.setData(
        { userId: userId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      if (isLoadingProfileData || !userId) return;

      // Sync with server once mutation has settled
      await utils.profile.getFullProfileOther.invalidate();
    },
  });

  const handleBlockUser = async (userId: string) => {
    await blockUser.mutateAsync({ blockUserId: userId });
    setIsActionSheetVisible(false);
  };

  const handleUnblockUser = async (userId: string) => {
    await unblockUser.mutateAsync({ blockedUserId: userId });
    setIsActionSheetVisible(false);
  };

  const handleOnPress = useCallback(() => {
    setIsActionSheetVisible(true);
  }, []);

  const posts = postsData?.pages.flatMap((page) => page.items) ?? [];
  const friends = friendsData?.pages.flatMap((page) => page.items) ?? [];

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View>
          <TouchableOpacity
            onPress={() => {
              if (userId) {
                handleOnPress();
              }
            }}
          >
            <MoreHorizontal />
          </TouchableOpacity>
        </View>
      ),
      title: username ?? profileData?.username,
    });
  }, [navigation, username, profileData, handleOnPress, userId]);

  const title = profileData?.networkStatus.isTargetUserBlocked
    ? "Unblock user"
    : "Block user";
  const subtitle = profileData?.networkStatus.isTargetUserBlocked
    ? "Are you sure you want to unblock this user?"
    : "Are you sure you want to block this user?";
  const buttonOptions = [
    {
      text: profileData?.networkStatus.isTargetUserBlocked
        ? "Unblock"
        : "Block",
      textProps: {
        color: "$red9",
      },
      onPress: () => {
        if (userId) {
          if (profileData?.networkStatus.isTargetUserBlocked) {
            void handleUnblockUser(userId);
          } else {
            void handleBlockUser(userId);
          }
        }
      },
    },
  ] satisfies ButtonOption[];

  const navigateToProfile = useCallback(
    ({ userId, username }: { userId: string; username: string }) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({
        pathname: `${segments[2]}/profile/[userId]/`, // TODO: will break, fix this
        params: { userId, username },
      });
    },
    [router, segments],
  );

  return (
    <BaseScreenView padding={0}>
      {userId && (
        <MediaOfYou
          navigateToProfile={navigateToProfile}
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
      <ActionSheet
        title={title}
        isVisible={isActionSheetVisible}
        subtitle={subtitle}
        buttonOptions={buttonOptions}
      />
    </BaseScreenView>
  );
};

export default Profile;
