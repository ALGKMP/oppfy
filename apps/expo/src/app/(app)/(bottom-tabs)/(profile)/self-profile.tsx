import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { useNavigation, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { getToken, Spacer, YStack } from "tamagui";

import PeopleCarousel from "~/components/Carousels/PeopleCarousel";
import CardContainer from "~/components/Containers/CardContainer";
import OtherPost from "~/components/NewPostTesting/OtherPost";
import PostCard from "~/components/NewPostTesting/ui/PostCard";
import ProfileHeaderDetails from "~/components/NewProfileTesting/ui/ProfileHeader";
import { BaseScreenView } from "~/components/Views";
import useProfile from "~/hooks/useProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";
import MediaOfYou from "./MediaOfYou";

type Post = RouterOutputs["post"]["paginatePostsOfUserSelf"]["items"][number];

const SelfProfile = () => {
  const utils = api.useUtils();
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
    refetch: refetchRecommendationsData,
  } = api.contacts.getRecommendationProfilesSelf.useQuery();

  const {
    data: friendsData,
    isLoading: isLoadingFriendsData,
    refetch: refetchFriendsData,
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
    await refetchPosts();
    setIsRefreshing(false);
  }, [refetchPosts]);

  const postItems = useMemo(
    () => postsData?.pages.flatMap((page) => page.items) ?? [],
    [postsData],
  );

  const friendItems = useMemo(
    () => friendsData?.pages.flatMap((page) => page.items) ?? [],
    [friendsData],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: profileData?.username,
    });
  }, [navigation, profileData?.username]);

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

  const renderItem = useCallback(
    (item: Post) => (
      <OtherPost
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
            title="Recommended Friends 👥"
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

  if (
    isLoadingProfileData ||
    isLoadingFriendsData ||
    isLoadingRecommendationsData ||
    isLoadingPostData ||
    true
  ) {
    const renderLoadingItem = () => <PostCard loading />;

    const renderLoadingHeader = () => (
      <YStack gap="$4">
        <ProfileHeaderDetails loading />
        <PeopleCarousel loading />
      </YStack>
    );

    return (
      <BaseScreenView padding={0} paddingBottom={0}>
        <FlashList
          data={PLACEHOLDER_DATA}
          renderItem={renderLoadingItem}
          ListHeaderComponent={renderLoadingHeader}
          estimatedItemSize={300}
          keyExtractor={(_item, index) => `loading-${index}`}
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
        renderItem={({ item }) => renderItem(item)}
        ListHeaderComponent={renderHeader}
        estimatedItemSize={300}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        ItemSeparatorComponent={() => <Spacer size="$4" />}
        ListHeaderComponentStyle={{
          marginBottom: getToken("$4", "space") as number,
        }}
      />
    </BaseScreenView>
  );
};

export default SelfProfile;
