import React, { useLayoutEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import {
  CameraOff,
  ChevronLeft,
  Lock,
  MoreHorizontal,
  ScrollText,
  Users,
  UserX,
} from "@tamagui/lucide-icons";
import { getToken, Spacer, View, YStack } from "tamagui";

import FriendCarousel from "~/components/FriendCarousel";
import BlockUserHeader from "~/components/Headers/BlockHeader";
import PostCard from "~/components/Post/PostCard";
import Header from "~/components/Profile/Header";
import RecommendationCarousel from "~/components/RecommendationCarousel";
import { H5, HeaderTitle, Icon, XStack } from "~/components/ui";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import useProfile from "~/hooks/useProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type Post = RouterOutputs["post"]["paginatePostsOfUserOther"]["items"][number];

const OtherProfile = () => {
  const router = useRouter();
  const navigation = useNavigation();

  const insets = useSafeAreaInsets();

  const { userId, username } = useLocalSearchParams<{
    userId: string;
    username: string;
  }>();

  const { data: profileData } = useProfile();

  const { data: networkRelationships, refetch: refetchNetworkRelationships } =
    api.profile.getNetworkRelationships.useQuery({ userId });

  const {
    data: postsData,
    isLoading: isLoadingPostData,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchPosts,
    hasNextPage,
  } = api.post.paginatePostsOfUserOther.useInfiniteQuery(
    { userId, pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!userId,
      refetchOnMount: true,
    },
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const postItems = postsData?.pages.flatMap((page) => page.items) ?? [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchPosts(), refetchNetworkRelationships()]);
    setIsRefreshing(false);
  };

  const handleOnEndReached = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  const onViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: ViewToken[];
  }) => {
    const visibleItemIds = viewableItems
      .filter((token) => token.isViewable)
      .map((token) => token.item?.postId)
      .filter((id): id is string => id !== undefined);

    setViewableItems(visibleItemIds);
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 40,
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      postId={item.postId}
      createdAt={item.createdAt}
      caption={item.caption}
      endpoint="other-profile"
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
        id: item.postId,
        recipient: {
          id: item.recipientId,
          username: item.recipientUsername ?? "",
          profilePicture: item.recipientProfilePicture,
        },
        type: item.mediaType,
        url: item.imageUrl,
        isViewable: viewableItems.includes(item.postId),
        dimensions: {
          width: item.width,
          height: item.height,
        },
      }}
      stats={{
        likes: item.likesCount,
        comments: item.commentsCount,
        hasLiked: item.hasLiked,
      }}
    />
  );

  const renderHeader = () => (
    <YStack gap="$2" position="relative">
      <Header userId={userId} />
      {profileData?.friendCount &&
      profileData?.friendCount > 0 &&
      !networkRelationships?.blocked ? (
        <RecommendationCarousel paddingHorizontal="$2.5" />
      ) : (
        <RecommendationCarousel paddingHorizontal="$2.5" />
      )}
      {(isLoadingPostData || postItems.length > 0) && (
        <HeaderTitle icon={<ScrollText />} paddingHorizontal="$2.5">
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
  );

  const renderNoPosts = () => {
    if (isLoadingPostData)
      return (
        <YStack gap="$4">
          <PostCard.loading />
        </YStack>
      );
    if (networkRelationships?.blocked) {
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

    if (networkRelationships?.privacy === "private") {
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
    <FlashList
      data={postItems}
      renderItem={renderPost}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderNoPosts}
      keyExtractor={(item) => `other-profile-post-${item.postId}`}
      estimatedItemSize={300}
      showsVerticalScrollIndicator={false}
      onEndReached={handleOnEndReached}
      onRefresh={handleRefresh}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      extraData={{ viewableItems, postItems }}
      refreshing={isRefreshing}
      ItemSeparatorComponent={() => <Spacer size="$4" />}
      ListHeaderComponentStyle={{
        marginTop: insets.top,
        marginBottom: getToken("$2", "space") as number,
      }}
    />
  );
};

export default OtherProfile;
