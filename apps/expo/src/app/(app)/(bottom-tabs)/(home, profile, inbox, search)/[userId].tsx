import React, { useCallback, useMemo, useRef, useState } from "react";
import { RefreshControl } from "react-native";
import { Tabs } from "react-native-collapsible-tab-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import { CameraOff, Lock, UserX } from "@tamagui/lucide-icons";
import { Spacer, View, YStack } from "tamagui";

import FriendCarousel from "~/components/FriendCarousel";
import { ProfileTabBar } from "~/components/Layouts/ProfileTabBar";
import PostCard from "~/components/Post/PostCard";
import Header from "~/components/Profile/Header";
import RecommendationCarousel from "~/components/RecommendationCarousel";
import { EmptyPlaceholder, Icon } from "~/components/ui";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type Post = RouterOutputs["post"]["paginatePosts"]["items"][number];

interface ViewToken {
  item: Post;
  key: string;
  index: number | null;
  isViewable: boolean;
  timestamp: number;
}

const OtherProfile = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const { userId, ...params } = useLocalSearchParams<{
    userId: string;
    username?: string;
    name?: string;
    profilePictureUrl?: string;
  }>();

  const {
    data: profile,
    refetch: refetchProfile,
    isLoading: isLoadingProfile,
  } = api.profile.getProfile.useQuery({ userId: userId });

  const {
    data: profileStats,
    refetch: refetchProfileStats,
    isLoading: isLoadingProfileStats,
  } = api.profile.getStats.useQuery({ userId });

  const {
    data: relationshipState,
    refetch: refetchRelationshipState,
    isLoading: isLoadingRelationshipStates,
  } = api.profile.getRelationshipStatesBetweenUsers.useQuery({ userId });

  const {
    data: posts,
    refetch: refetchPosts,
    isLoading: isLoadingPostData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = api.post.paginatePosts.useInfiniteQuery(
    { userId, pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const {
    data: postsMadeByUser,
    refetch: refetchPostsMadeByUser,
    isLoading: isLoadingPostsMadeByUserData,
    hasNextPage: hasNextPagePostsMadeByUser,
    fetchNextPage: fetchNextPagePostsMadeByUser,
    isFetchingNextPage: isFetchingNextPagePostsMadeByUser,
  } = api.post.paginatePostsMadeByUser.useInfiniteQuery(
    { userId, pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const isLoading =
    isLoadingProfile || isLoadingProfileStats || isLoadingRelationshipStates;

  const postItems = posts?.pages.flatMap((page) => page.items) ?? [];
  const postsMadeByUserItems =
    postsMadeByUser?.pages.flatMap((page) => page.items) ?? [];

  // Memoize the profile prop to prevent unnecessary re-renders
  const headerProfile = useMemo(() => {
    if (profile) {
      return profile;
    }
    return {
      username: params.username,
      name: params.name,
      profilePictureUrl: params.profilePictureUrl,
    };
  }, [profile, params.username, params.name, params.profilePictureUrl]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchProfile(),
      refetchProfileStats(),
      refetchRelationshipState(),
      refetchPosts(),
      refetchPostsMadeByUser(),
    ]);
    setIsRefreshing(false);
  };

  const handleOnEndReached = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  const handleOnEndReachedPostsMadeByUser = async () => {
    if (hasNextPagePostsMadeByUser && !isFetchingNextPagePostsMadeByUser) {
      await fetchNextPagePostsMadeByUser();
    }
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visibleItemIds = viewableItems
        .filter((token) => token.isViewable)
        .map((token) => token.item.post.id);

      setViewableItems(visibleItemIds);
    },
    [],
  );

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard {...item} isViewable={viewableItems.includes(item.post.id)} />
  );

  const renderPostMadeByUser = ({ item }: { item: Post }) => (
    <PostCard {...item} isViewable={viewableItems.includes(item.post.id)} />
  );

  const renderHeader = () => (
    <YStack
      gap="$2"
      paddingTop={insets.top}
      backgroundColor="$background"
      pointerEvents="box-none"
    >
      <Header
        type="other"
        profile={headerProfile}
        stats={profileStats}
        relationshipState={relationshipState}
        isLoading={isLoading}
      />

      {/* {isLoading ? null : (
        <>
          {profileStats &&
          relationshipState &&
          profileStats.friends > 0 &&
          !relationshipState.isBlocked ? (
            <FriendCarousel
              userId={userId}
              username={headerProfile.username ?? ""}
              paddingHorizontal="$2.5"
            />
          ) : (
            <RecommendationCarousel paddingHorizontal="$2.5" />
          )}
        </>
      )} */}

      <Icon
        name="chevron-back"
        onPress={() => router.back()}
        blurred
        style={{
          position: "absolute",
          top: 12,
          left: 12,
        }}
      />
    </YStack>
  );

  const renderEmptyList = () => {
    if (isLoadingPostData) {
      return (
        <YStack gap="$4">
          {Array.from({ length: 3 }).map((_, index) => (
            <PostCard.Skeleton key={index} />
          ))}
        </YStack>
      );
    }

    if (relationshipState?.isBlocked) {
      return (
        <View paddingTop="$6">
          <EmptyPlaceholder
            icon={<UserX size="$10" />}
            title="This user has been blocked"
            subtitle="You cannot view their content or interact with them."
          />
        </View>
      );
    }

    if (profile?.privacy === "private") {
      return (
        <View paddingTop="$6">
          <EmptyPlaceholder
            icon={<Lock size="$10" />}
            title="This account is private"
            subtitle="You need to follow this user to view their posts"
          />
        </View>
      );
    }

    return (
      <View paddingTop="$6">
        <EmptyPlaceholder
          icon={<CameraOff size="$10" />}
          title="No posts yet"
        />
      </View>
    );
  };

  const renderEmptyListPostsMadeByUser = () => {
    if (isLoadingPostsMadeByUserData) {
      return (
        <YStack gap="$4">
          {Array.from({ length: 3 }).map((_, index) => (
            <PostCard.Skeleton key={index} />
          ))}
        </YStack>
      );
    }

    if (relationshipState?.isBlocked) {
      return (
        <View paddingTop="$6">
          <EmptyPlaceholder
            icon={<UserX size="$10" />}
            title="This user has been blocked"
            subtitle="You cannot view their content or interact with them."
          />
        </View>
      );
    }

    if (profile?.privacy === "private") {
      return (
        <View paddingTop="$6">
          <EmptyPlaceholder
            icon={<Lock size="$10" />}
            title="This account is private"
            subtitle="You need to follow this user to view their posts"
          />
        </View>
      );
    }

    return (
      <View paddingTop="$6">
        <EmptyPlaceholder
          icon={<CameraOff size="$10" />}
          title="No posts made yet"
        />
      </View>
    );
  };

  return (
    <Tabs.Container
      renderHeader={renderHeader}
      allowHeaderOverscroll={true}
      renderTabBar={(props) => <ProfileTabBar {...props} />}
      headerContainerStyle={{ elevation: 0 }}
      minHeaderHeight={insets.top}
      lazy
    >
      <Tabs.Tab name="Posts">
        <Tabs.FlashList
          data={postItems}
          renderItem={renderPost}
          estimatedItemSize={664}
          ListEmptyComponent={renderEmptyList}
          keyExtractor={(item) => `other-profile-post-${item.post.id}`}
          showsVerticalScrollIndicator={false}
          onEndReached={handleOnEndReached}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
          extraData={viewableItems}
          ItemSeparatorComponent={() => <Spacer size="$4" />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      </Tabs.Tab>
      <Tabs.Tab name="Tagged">
        <Tabs.FlashList
          data={postsMadeByUserItems}
          renderItem={renderPostMadeByUser}
          estimatedItemSize={664}
          ListEmptyComponent={renderEmptyListPostsMadeByUser}
          keyExtractor={(item) => `other-profile-post-tagged-${item.post.id}`}
          showsVerticalScrollIndicator={false}
          onEndReached={handleOnEndReachedPostsMadeByUser}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
          extraData={viewableItems}
          ItemSeparatorComponent={() => <Spacer size="$4" />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      </Tabs.Tab>
    </Tabs.Container>
  );
};

export default OtherProfile;
