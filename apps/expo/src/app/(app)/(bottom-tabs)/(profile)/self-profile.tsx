import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { useNavigation, useRouter } from "expo-router";
import { FlashList, ViewToken } from "@shopify/flash-list";
import { CameraOff, MoreHorizontal } from "@tamagui/lucide-icons";
import { getToken, Spacer, Text, View, YStack } from "tamagui";

import PeopleCarousel from "~/components/Carousels/PeopleCarousel";
import OtherPost from "~/components/NewPostTesting/OtherPost";
import SelfPost from "~/components/NewPostTesting/SelfPost";
import PostCard from "~/components/NewPostTesting/ui/PostCard";
import ProfileHeaderDetails from "~/components/NewProfileTesting/ui/ProfileHeader";
import { BaseScreenView } from "~/components/Views";
import useProfile from "~/hooks/useProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

type Post = RouterOutputs["post"]["paginatePostsOfUserSelf"]["items"][number];

const SelfProfile = () => {
  const navigation = useNavigation();
  const router = useRouter();

  const {
    profile: profileData,
    isLoading: isLoadingProfileData,
    refetch: refetchProfile,
  } = useProfile();

  const {
    data: recommendationsData,
    isLoading: isLoadingRecommendationsData,
    refetch: refetchRecommendations,
  } = api.contacts.getRecommendationProfilesSelf.useQuery();

  const {
    data: friendsData,
    isLoading: isLoadingFriendsData,
    refetch: refetchFriends,
  } = api.friend.paginateFriendsSelf.useInfiniteQuery(
    { pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const {
    data: postsData,
    isLoading: isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchPosts,
    hasNextPage,
  } = api.post.paginatePostsOfUserSelf.useInfiniteQuery(
    { pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchProfile(),
      refetchRecommendations(),
      refetchFriends(),
      refetchPosts(),
    ]);
    setIsRefreshing(false);
  }, [refetchProfile, refetchRecommendations, refetchFriends, refetchPosts]);

  const handleOnEndReached = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const postItems = useMemo(
    () => postsData?.pages.flatMap((page) => page.items) ?? [],
    [postsData],
  );

  const friendItems = useMemo(
    () => friendsData?.pages.flatMap((page) => page.items) ?? [],
    [friendsData],
  );

  const isLoadingData = useMemo(() => {
    return isLoadingProfileData || isLoadingFriendsData || isLoadingPostData;
  }, [isLoadingProfileData, isLoadingFriendsData, isLoadingPostData]);

  const navigateToProfile = useCallback(
    ({ userId, username }: { userId: string; username: string }) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({
        pathname: "/(profile)/profile/[userId]",
        params: { userId, username },
      });
    },
    [router],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: profileData?.username,
      headerRight: () => (
        <View>
          <TouchableOpacity onPress={() => router.push("/(app)/(settings)")}>
            <MoreHorizontal />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, profileData?.username, router]);

  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visibleItemIds = viewableItems
        .filter((token) => token.isViewable)
        .map((token) => token.item?.postId)
        .filter((id): id is string => id !== undefined);

      setViewableItems(visibleItemIds);
    },
    [],
  );

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 40,
    }),
    [],
  );

  const renderPost = useCallback(
    (item: Post, isViewable: boolean) => (
      <SelfPost
        key={item.postId}
        id={item.postId}
        createdAt={item.createdAt}
        caption={item.caption}
        self={{
          id: profileData?.userId ?? "",
          username: profileData?.username ?? "",
          profilePicture: profileData?.profilePictureUrl,
        }}
        author={{
          id: item.authorId,
          username: item.authorUsername ?? "",
          profilePicture: item.authorProfilePicture,
        }}
        recipient={{
          id: item.recipientId,
          username: item.recipientUsername ?? "",
          profilePicture: item.recipientProfilePicture,
        }}
        media={{
          type: item.mediaType,
          url: item.imageUrl,
          isViewable: isViewable,
          dimensions: {
            width: item.width,
            height: item.height,
          },
        }}
        stats={{
          likes: item.likesCount,
          comments: item.commentsCount,
        }}
      />
    ),
    [profileData],
  );

  const renderHeader = useCallback(
    () => (
      <YStack gap="$4">
        <ProfileHeaderDetails
          loading={false}
          data={{
            userId: profileData?.userId ?? "",
            username: profileData?.username ?? "",
            name: profileData?.name ?? "",
            bio: profileData?.bio ?? "",
            followerCount: profileData?.followerCount ?? 0,
            followingCount: profileData?.followingCount ?? 0,
            profilePictureUrl: profileData?.profilePictureUrl,
          }}
          onFollowingPress={() =>
            router.push("/self-connections/following-list")
          }
          onFollowersPress={() =>
            router.push("/self-connections/followers-list")
          }
          actions={[
            {
              label: "Edit Profile",
              onPress: () => {
                router.push("/edit-profile");
              },
            },
            {
              label: "Share Profile",
              onPress: () => {
                router.push("/share-profile");
              },
            },
          ]}
        />

        {friendItems.length > 0 ? (
          <PeopleCarousel
            loading={isLoadingFriendsData}
            data={friendItems}
            title="Friends 🔥"
            showMore={friendItems.length < (profileData?.friendCount ?? 0)}
            onItemPress={navigateToProfile}
            onShowMore={() => {
              // Handle show more friends
            }}
          />
        ) : (
          <PeopleCarousel
            loading={isLoadingRecommendationsData}
            data={recommendationsData ?? []}
            title="Suggestions 🔥"
            showMore={false}
            onItemPress={navigateToProfile}
            onShowMore={() => {
              // Handle show more recommendations
            }}
          />
        )}
      </YStack>
    ),
    [
      friendItems,
      isLoadingFriendsData,
      isLoadingRecommendationsData,
      navigateToProfile,
      profileData,
      recommendationsData,
      router,
    ],
  );

  if (isLoadingData) {
    return (
      <BaseScreenView padding={0} paddingBottom={0}>
        <FlashList
          data={PLACEHOLDER_DATA}
          renderItem={() => <PostCard loading />}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListHeaderComponent={() => (
            <YStack gap="$4">
              <ProfileHeaderDetails loading />
              <PeopleCarousel loading />
            </YStack>
          )}
          estimatedItemSize={300}
          keyExtractor={(_, index) => `loading-${index}`}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <Spacer size="$4" />}
          ListHeaderComponentStyle={{
            marginBottom: getToken("$4", "space") as number,
          }}
        />
      </BaseScreenView>
    );
  }

  return (
    <BaseScreenView padding={0} paddingBottom={0}>
      <FlashList
        data={postItems}
        renderItem={({ item }) =>
          renderPost(item, viewableItems.includes(item.postId))
        }
        ListHeaderComponent={renderHeader}
        keyExtractor={(item) => `self-profile-post-${item.postId}`}
        estimatedItemSize={600}
        showsVerticalScrollIndicator={false}
        onEndReached={handleOnEndReached}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        extraData={{ viewableItems, postItems }}
        ItemSeparatorComponent={() => <Spacer size="$4" />}
        ListHeaderComponentStyle={{
          marginBottom: getToken("$4", "space") as number,
        }}
        ListEmptyComponent={() => (
          <YStack
            alignItems="center"
            justifyContent="center"
            flex={1}
            paddingVertical="$10"
          >
            <CameraOff size={100} color="gray" />
            <Text fontSize="$6">No posts yet</Text>
          </YStack>
        )}
      />
    </BaseScreenView>
  );
};

export default SelfProfile;
