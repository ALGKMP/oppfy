import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TouchableOpacity } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { CameraOff, Lock, MoreHorizontal, UserX } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { getToken, Spacer, View, YStack } from "tamagui";

import PeopleCarousel from "~/components/Carousels/PeopleCarousel";
import FriendCarousel from "~/components/CarouselsNew/FriendCarousel";
import RecommendationCarousel from "~/components/CarouselsNew/RecommendationCarousel";
import OtherPost from "~/components/NewPostTesting/OtherPost";
import PostCard from "~/components/NewPostTesting/ui/PostCard";
import Header from "~/components/NewProfileTesting/Header";
import type { ButtonOption } from "~/components/Sheets";
import { ActionSheet } from "~/components/Sheets";
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
  const toast = useToastController();

  const utils = api.useUtils();

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
    await Promise.all([
      refetchProfileData(),
      refetchPosts(),
    ]);
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

  const [sheetState, setSheetState] = useState<
    "closed" | "moreOptions" | "reportOptions"
  >("closed");

  const { isPending: isBlocking, ...blockUser } =
    api.block.blockUser.useMutation({
      onMutate: async (_newBlockedUser) => {
        // Cancel outgoing fetches (so they don't overwrite our optimistic update)
        await utils.profile.getFullProfileOther.cancel();

        // Get the data from the queryCache
        const prevData = utils.profile.getFullProfileOther.getData({ userId });
        if (prevData === undefined) return;

        // Optimistically update the data
        utils.profile.getFullProfileOther.setData(
          { userId },
          {
            ...prevData,
            networkStatus: {
              ...prevData.networkStatus,
              blocked: true,
            },
          },
        );

        // Return the previous data so we can revert if something goes wrong
        return { prevData };
      },
      onError: (_err, _newBlockedUser, ctx) => {
        if (ctx === undefined) return;

        // If the mutation fails, use the context-value from onMutate
        utils.profile.getFullProfileOther.setData({ userId }, ctx.prevData);
      },
      onSettled: async () => {
        await utils.profile.getFullProfileOther.invalidate({ userId });
      },
    });
  const { isPending: isUnblocking, ...unblockUser } =
    api.block.unblockUser.useMutation({
      onMutate: async (_newUnblockedUser) => {
        // Cancel outgoing fetches (so they don't overwrite our optimistic update)
        await utils.profile.getFullProfileOther.cancel();

        // Get the data from the queryCache
        const prevData = utils.profile.getFullProfileOther.getData({ userId });
        if (prevData === undefined) return;

        // Optimistically update the data
        utils.profile.getFullProfileOther.setData(
          { userId },
          {
            ...prevData,
            networkStatus: {
              ...prevData.networkStatus,
              blocked: false,
            },
          },
        );

        // Return the previous data so we can revert if something goes wrong
        return { prevData };
      },
      onError: (_err, _newUnblockedUser, ctx) => {
        if (ctx === undefined) return;

        // If the mutation fails, use the context-value from onMutate
        utils.profile.getFullProfileOther.setData({ userId }, ctx.prevData);
      },
      onSettled: async () => {
        await utils.profile.getFullProfileOther.invalidate({ userId });
      },
    });

  const handleOpenMoreOptionsSheet = useCallback(() => {
    setSheetState("moreOptions");
  }, []);

  const handleCloseMoreOptionsSheet = useCallback(() => {
    setSheetState("closed");
  }, []);

  const handleBlockUser = useCallback(async () => {
    await blockUser.mutateAsync({ userId });
    toast.show("User Blocked");
  }, [blockUser, userId, toast]);

  const handleUnblockUser = useCallback(async () => {
    await unblockUser.mutateAsync({ userId });
    toast.show("User Unblocked");
  }, [unblockUser, userId, toast]);

  const moreOptionsButtonOptions: ButtonOption[] = useMemo(() => {
    const isBlocked = otherProfileData?.networkStatus.blocked ?? false;

    return [
      {
        text: isBlocked
          ? isUnblocking
            ? "Unblocking..."
            : "Unblock User"
          : isBlocking
            ? "Blocking..."
            : "Block User",
        textProps: {
          color: isBlocking || isUnblocking ? "$gray9" : "$red9",
        },
        autoClose: false,
        disabled: isBlocking || isUnblocking,
        onPress: isBlocked ? handleUnblockUser : handleBlockUser,
      },
    ];
  }, [
    otherProfileData?.networkStatus.blocked,
    isUnblocking,
    isBlocking,
    handleUnblockUser,
    handleBlockUser,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: username,
      headerRight: () => (
        <View>
          <TouchableOpacity onPress={handleOpenMoreOptionsSheet}>
            <MoreHorizontal />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, username, otherProfileData, handleOpenMoreOptionsSheet]);

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
          <PeopleCarousel loading />
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

      <ActionSheet
        isVisible={sheetState === "moreOptions"}
        buttonOptions={moreOptionsButtonOptions}
        onCancel={handleCloseMoreOptionsSheet}
      />
    </>
  );
});

export default OtherProfile;
