import React, { useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraOff, Lock, UserX } from "@tamagui/lucide-icons";
import { getToken, Spacer, View, YStack } from "tamagui";

import FriendCarousel from "~/components/FriendCarousel";
import Header from "~/components/Profile/Header";
import { PostGrid } from "~/components/Profile/PostGrid";
import RecommendationCarousel from "~/components/RecommendationCarousel";
import { EmptyPlaceholder, HeaderTitle, Icon } from "~/components/ui";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type Post = RouterOutputs["post"]["paginatePosts"]["items"][number];

const OtherProfile = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

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
  } = api.post.paginatePosts.useInfiniteQuery(
    { userId, pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const isLoading =
    isLoadingProfile || isLoadingProfileStats || isLoadingRelationshipStates;

  const postItems = posts?.pages.flatMap((page) => page.items) ?? [];

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
    ]);
    setIsRefreshing(false);
  };

  const handlePostPress = (post: Post) => {
    router.push(`/post/${post.post.id}`);
  };

  const renderEmptyGrid = () => {
    if (isLoadingPostData) {
      return (
        <YStack gap="$4" paddingHorizontal="$2.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <View
              key={index}
              width="48%"
              aspectRatio={1}
              backgroundColor="$gray3"
              borderRadius="$4"
            />
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

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          progressViewOffset={insets.top}
        />
      }
    >
      {/* Header */}
      <YStack gap="$2" position="relative">
        <Header
          type="other"
          profile={headerProfile}
          stats={profileStats}
          relationshipState={relationshipState}
          isLoading={isLoading}
        />

        {isLoading ? null : (
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
        )}

        {(isLoadingPostData || postItems.length > 0) && (
          <HeaderTitle icon="document-text" paddingHorizontal="$2.5">
            Posts
          </HeaderTitle>
        )}

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

      <Spacer size="$4" />

      {/* Posts Grid */}
      {postItems.length > 0 ? (
        <PostGrid
          posts={postItems}
          onPostPress={handlePostPress}
          paddingHorizontal={getToken("$2.5", "space") as number}
        />
      ) : (
        renderEmptyGrid()
      )}
    </ScrollView>
  );
};

export default OtherProfile;
