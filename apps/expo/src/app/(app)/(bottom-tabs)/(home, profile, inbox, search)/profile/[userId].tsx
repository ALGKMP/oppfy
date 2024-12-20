import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { CameraOff, Lock, UserX } from "@tamagui/lucide-icons";
import { getToken, Spacer, View, YStack } from "tamagui";

import FriendCarousel from "~/components/CarouselsNew/FriendCarousel";
import RecommendationCarousel from "~/components/CarouselsNew/RecommendationCarousel";
import BlockUserHeader from "~/components/Headers/BlockHeader";
import OtherPost from "~/components/NewPostTesting/OtherPost";
import PostCard from "~/components/NewPostTesting/ui/PostCard";
import Header from "~/components/NewProfileTesting/Header";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import useProfile from "~/hooks/useProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type Post = RouterOutputs["post"]["paginatePostsByUserOther"]["items"][number];

const OtherProfile = React.memo(() => {
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);

  const navigation = useNavigation();

  const { userId, username } = useLocalSearchParams<{
    userId: string;
    username: string;
  }>();

  const { data: selfProfileData } = useProfile();

  const {
    data: otherProfileData,
    isLoading: isLoadingProfileData,
    refetch: refetchProfileData,
  } = api.profile.getFullProfileOther.useQuery(
    { userId },
    { refetchOnMount: true },
  );

  const blocked = otherProfileData?.networkStatus.blocked ?? false;
  const isPrivate = otherProfileData?.networkStatus.privacy === "private";
  const isFollowing =
    otherProfileData?.networkStatus.targetUserFollowState === "Following";

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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchProfileData(), refetchPosts()]);
    setIsRefreshing(false);
  }, [refetchProfileData, refetchPosts]);

  const handleOnEndReached = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const postItems = useMemo(
    () => postsData?.pages.flatMap((page) => page.items) ?? [],
    [postsData],
  );

  const isLoading = isLoadingProfileData || isLoadingPostData;

  // TODO: Action Sheet
  const [sheetState, setSheetState] = useState<
    "closed" | "moreOptions" | "reportOptions"
  >("closed");

  // TODO: Action Sheet In Header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: username,
      headerRight: () => <BlockUserHeader userId={userId} />,
    });
  }, [navigation, username ]);

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
    ({ item }: { item: Post }) => {
      return (
        <OtherPost
          id={item.postId}
          endpoint="other-profile"
          createdAt={item.createdAt}
          caption={item.caption}
          self={{
            id: selfProfileData?.userId ?? "",
            username: selfProfileData?.username ?? "",
            profilePicture: selfProfileData?.profilePictureUrl,
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
            isViewable: viewableItems.includes(item.postId),
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
      );
    },
    [
      selfProfileData?.profilePictureUrl,
      selfProfileData?.userId,
      selfProfileData?.username,
      viewableItems,
    ],
  );

  const renderHeader = () => (
    <YStack gap="$4">
      <Header userId={userId} />
      {selfProfileData?.friendCount &&
      selfProfileData?.friendCount > 0 &&
      !blocked ? (
        <FriendCarousel userId={userId} />
      ) : (
        <RecommendationCarousel />
      )}
    </YStack>
  );

  const renderNoPosts = useCallback(() => {
    if (blocked) {
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

    if (isPrivate && !isFollowing) {
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
  }, [blocked, isPrivate, isFollowing]);

  const listFooterComponent = useCallback(() => {
    if (isLoading) {
      return (
        <YStack gap="$4">
          <PostCard loading />
          <PostCard loading />
        </YStack>
      );
    }
    return null;
  }, [isLoading]);

  if (isLoading) {
    return (
      <BaseScreenView padding={0} paddingBottom={0}>
        <YStack gap="$4">
          <PostCard loading />
        </YStack>
      </BaseScreenView>
    );
  }

  return (
    <>
      <BaseScreenView padding={0} paddingBottom={0} scrollEnabled={false}>
        <FlashList
          ref={scrollRef}
          data={postItems}
          renderItem={renderPost}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderNoPosts}
          ListFooterComponent={listFooterComponent}
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
            marginBottom: getToken("$4", "space") as number,
          }}
        />
      </BaseScreenView>

      {/* <ActionSheet
        isVisible={sheetState === "moreOptions"}
        buttonOptions={moreOptionsButtonOptions}
        onCancel={handleCloseMoreOptionsSheet}
      /> */}
    </>
  );
});

export default OtherProfile;
