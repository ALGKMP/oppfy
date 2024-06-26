import React, { useEffect, useMemo, useState } from "react";
import { Dimensions, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Heart, MoreHorizontal, SendHorizontal } from "@tamagui/lucide-icons";
import {
  Avatar,
  Separator,
  SizableText,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";
import type z from "zod";

import type { sharedValidators } from "@oppfy/validators";

import { CommentsBottomSheet } from "~/components/BottomSheets";
import ReportPostActionSheet from "~/components/Sheets/ReportPostActionSheet";
import { api } from "~/utils/api";

const { width: screenWidth } = Dimensions.get("window");

interface PostItemProps {
  post: z.infer<typeof sharedValidators.media.post>;
}

const PostItem = (props: PostItemProps) => {
  const { post } = props;
  const [status, _setStatus] = useState<"success" | "loading" | "error">(
    "success",
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [showViewMore, setShowViewMore] = useState(post.caption.length > 100);

  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  const router = useRouter();

  const utils = api.useUtils();
  const profile = utils.profile.getFullProfileSelf.getData();

  const {
    data: hasLiked,
    isLoading: isLoadingHasLiked,
    isError,
  } = api.post.hasliked.useQuery({ postId: post.postId });

  const [isLiked, setIsLiked] = useState<boolean>(hasLiked ?? false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setIsLiked(hasLiked ?? false);
  }, [hasLiked]);

  const likePost = api.post.likePost.useMutation({
    onMutate: async () => {
      await utils.post.paginatePostsOfUserSelf.cancel();
      const prevPosts = utils.post.paginatePostsOfUserSelf.getInfiniteData({
        pageSize: 10,
      });

      if (!prevPosts) {
        console.warn("prevPosts is undefined");
        return { prevPosts: undefined };
      }

      utils.post.paginatePostsOfUserSelf.setInfiniteData(
        { pageSize: 10 },
        (prevData) => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            pages: prevData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item?.postId === post.postId
                  ? {
                      ...item,
                      likesCount: (item.likesCount || 0) + 1,
                      isLiked: true,
                    }
                  : item,
              ),
            })),
          };
        },
      );

      return { prevPosts };
    },
    onError: (error, variables, context) => {
      if (context?.prevPosts) {
        utils.post.paginatePostsOfUserSelf.setInfiniteData(
          { pageSize: 10 },
          context.prevPosts,
        );
      }
    },
    onSettled: async () => {
      await utils.post.paginatePostsOfUserSelf.invalidate();
    },
  });

  const unlikePost = api.post.unlikePost.useMutation({
    onMutate: async () => {
      await utils.post.paginatePostsOfUserSelf.cancel();
      const prevPosts = utils.post.paginatePostsOfUserSelf.getInfiniteData({
        pageSize: 10,
      });

      if (!prevPosts) {
        console.warn("prevPosts is undefined");
        return { prevPosts: undefined };
      }

      utils.post.paginatePostsOfUserSelf.setInfiniteData(
        { pageSize: 10 },
        (prevData) => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            pages: prevData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item?.postId === post.postId
                  ? {
                      ...item,
                      likesCount: Math.max((item.likesCount || 0) - 1, 0),
                      isLiked: false,
                    }
                  : item,
              ),
            })),
          };
        },
      );

      return { prevPosts };
    },
    onError: (error, variables, context) => {
      if (context?.prevPosts) {
        utils.post.paginatePostsOfUserSelf.setInfiniteData(
          { pageSize: 10 },
          context.prevPosts,
        );
      }
    },
    onSettled: async () => {
      await utils.post.paginatePostsOfUserSelf.invalidate();
    },
  });

  // For the fuckin like button
  const imageLikeScale = useSharedValue(0);
  const buttonLikeScale = useSharedValue(1);

  const handleDoubleTabLike = async () => {
    imageLikeScale.value = withSpring(
      1,
      {
        duration: 400,
        dampingRatio: 0.5,
        stiffness: 50,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 2,
        reduceMotion: ReduceMotion.System,
      },
      () => {
        imageLikeScale.value = withDelay(150, withTiming(0, { duration: 250 }));
      },
    );

    buttonLikeScale.value = withSpring(
      1.1,
      {
        duration: 100,
        dampingRatio: 0.5,
        stiffness: 50,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 2,
        reduceMotion: ReduceMotion.System,
      },
      () => {
        buttonLikeScale.value = withTiming(1, { duration: 200 });
      },
    );
    if (!isLiked) {
      await likePost.mutateAsync({ postId: post.postId });
      setIsLiked(true); // Update the liked state
    }
  };

  const handleLikeButtonOnPress = async () => {
    buttonLikeScale.value = withSpring(
      1.1,
      {
        duration: 100,
        dampingRatio: 0.5,
        stiffness: 50,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 2,
        reduceMotion: ReduceMotion.System,
      },
      () => {
        buttonLikeScale.value = withTiming(1, { duration: 200 });
      },
    );
    if (isLiked) {
      setIsLiked(!isLiked);
      await unlikePost.mutateAsync({ postId: post.postId });
    } else {
      setIsLiked(!isLiked);
      await likePost.mutateAsync({ postId: post.postId });
    }
  };

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleDoubleTabLike)();
    });

  const heartImageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: imageLikeScale.value }],
    };
  });

  const heartButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonLikeScale.value }],
    };
  });

  const renderCaption = () => {
    const maxLength = 100; // Set max length for the caption
    if (post.caption.length <= maxLength || isExpanded) {
      return post.caption;
    }
    return `${post.caption.substring(0, maxLength)}...`;
  };

  const handleUserClicked = (profileId: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.navigate({
      pathname: "/(profile)/profile/[profile-id]/",
      params: { profileId: String(profileId) },
    });
  };

  if (status === "loading" || isLoadingHasLiked) {
    return (
      <View flex={1} alignItems="center" justifyContent="center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View
      flex={1}
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      borderRadius={20}
      backgroundColor="$gray2"
      marginBottom="$5"
    >
      <GestureDetector gesture={doubleTap}>
        <View aspectRatio={post.width / post.height} width="100%">
          <Image
            source={{ uri: post.imageUrl }}
            style={[
              {
                // width: post.width,
                // height: post.height,
                width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 20,
              },
            ]}
            contentFit="cover"
          >
            <Animated.View style={[heartImageAnimatedStyle]}>
              <Heart size={100} color="red" fill="red" />
            </Animated.View>
          </Image>
        </View>
      </GestureDetector>
      <XStack
        flex={1}
        position="absolute"
        top={10}
        left={10}
        width="95%"
        justifyContent="space-between"
        alignContent="center"
      >
        <XStack gap="$2.5">
          <Avatar circular size="$5">
            <Avatar.Image
              accessibilityLabel="Cam"
              src={profile?.profilePictureUrl ?? ""}
              onPress={() => handleUserClicked(post.recipientProfileId)}
            />
            <Avatar.Fallback backgroundColor="$blue10" />
          </Avatar>
          <YStack gap="$1" justifyContent="center">
            <TouchableOpacity
              onPress={() => handleUserClicked(post.recipientProfileId)}
            >
              <SizableText
                size="$3"
                lineHeight={14}
                margin={0}
                padding={0}
                shadowRadius={3}
                shadowOpacity={0.5}
                fontWeight="bold"
              >
                {profile?.username ?? "@RecipientUsername"}
              </SizableText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                handleUserClicked(post.authorProfileId);
              }}
            >
              <XStack gap="$1" alignItems="center">
                <SizableText
                  size="$3"
                  lineHeight={15}
                  marginTop={0}
                  padding={0}
                >
                  📸
                </SizableText>
                <SizableText size="$2" lineHeight={15} color="$gray2">
                  posted by:
                </SizableText>

                <SizableText
                  size="$2"
                  lineHeight={15}
                  fontWeight="bold"
                  color="$blue9"
                >
                  {profile?.username ?? "@AuthorUsername"}
                </SizableText>
              </XStack>
            </TouchableOpacity>
          </YStack>
        </XStack>
        <View justifyContent="center" alignItems="center">
          <TouchableOpacity onPress={() => setIsReportModalVisible(true)}>
            <MoreHorizontal size={24} color="$gray12" />
          </TouchableOpacity>
        </View>
      </XStack>

      {/* Under Post */}
      <View
        flex={1}
        alignSelf="stretch"
        padding="$2"
        paddingTop="$3"
        borderBottomRightRadius="$8"
        borderBottomLeftRadius="$8"
        backgroundColor="$gray2"
      >
        <XStack gap="$2" alignItems="flex-start">
          {/* Comment Button */}
          <View flex={4} justifyContent="center">
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <View
                flex={1}
                justifyContent="flex-start"
                padding="$2.5"
                borderRadius="$7"
                backgroundColor="$gray5"
              >
                <Text fontWeight="bold" color="$gray9">
                  Comment
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {/* Like Button */}
          <View flex={1} justifyContent="center">
            <TouchableOpacity onPress={handleLikeButtonOnPress}>
              <View
                justifyContent="center"
                alignItems="center"
                borderRadius="$7"
                padding="$2"
                backgroundColor="$gray5"
              >
                <Animated.View style={[heartButtonAnimatedStyle]}>
                  <Heart
                    size={24}
                    padding="$3"
                    color={isLiked ? "red" : "$gray12"}
                    fill="red"
                    fillOpacity={isLiked ? 1 : 0}
                  />
                </Animated.View>
              </View>
            </TouchableOpacity>
          </View>
          {/* Share Button */}
          <View flex={1} justifyContent="center">
            <TouchableOpacity>
              <View
                flex={1}
                justifyContent="center"
                alignItems="center"
                padding="$2"
                borderRadius="$7"
                backgroundColor="$gray5"
              >
                <SendHorizontal size={24} padding="$3" color="$gray12" />
              </View>
            </TouchableOpacity>
          </View>
        </XStack>

        {/* Comments and Likes */}
        <XStack flex={1} gap="$2">
          <View flex={4} alignItems="flex-start" paddingLeft="$2.5">
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <SizableText size="$2" fontWeight="bold" color="$gray10">
                {post.commentsCount > 0
                  ? post.commentsCount > 1
                    ? `${post.commentsCount} comments`
                    : `${post.commentsCount} comment`
                  : "Be the first to comment"}
              </SizableText>
            </TouchableOpacity>
          </View>
          <View flex={2} alignItems="flex-start">
            <TouchableOpacity>
              <SizableText size="$2" fontWeight="bold" color="$gray10">
                {post.likesCount > 0 ? `${post.likesCount} likes` : ""}
              </SizableText>
            </TouchableOpacity>
          </View>
        </XStack>

        {/* Caption */}
        <View flex={1} alignItems="flex-start" padding="$2">
          <TouchableOpacity
            onPress={() => {
              setIsExpanded(!isExpanded);
              setShowViewMore(false);
            }}
          >
            <Text numberOfLines={isExpanded ? 0 : 2}>
              {renderCaption()}
              {showViewMore && !isExpanded ? (
                <Text color="$gray10"> more</Text>
              ) : (
                ""
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <CommentsBottomSheet
        postId={post.postId}
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
      />
      <ReportPostActionSheet
        title="Report Post"
        subtitle="Select reason"
        postId={post.postId}
        isVisible={isReportModalVisible}
        onCancel={() => setIsReportModalVisible(false)}
      />
    </View>
  );
};

const MediaOfYou = () => {
  const [status, setStatus] = useState<"success" | "loading" | "error">(
    "loading",
  );

  const {
    data: postData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.post.paginatePostsOfUserSelf.useInfiniteQuery(
    {
      pageSize: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const itemCount = useMemo(() => {
    if (postData === undefined) return 0;

    return postData.pages.reduce((acc, page) => acc + page.items.length, 0);
  }, [postData]);

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const posts = useMemo(
    () => postData?.pages.flatMap((page) => page.items),
    [postData],
  );

  const placeholderData = useMemo(() => {
    return Array.from({ length: 20 }, () => null);
  }, []);

  return (
    <View flex={1}>
      <Separator margin={10} borderColor="white" />
      {itemCount ? (
        <FlashList
          data={isLoading ? placeholderData : posts}
          numColumns={1}
          onEndReached={handleOnEndReached}
          renderItem={({ item }) => {
            if (item === null || item === undefined) {
              return null;
            }
            return <PostItem post={item} />;
          }}
          estimatedItemSize={screenWidth}
        />
      ) : (
        <View flex={1} justifyContent="center" alignItems="center">
          <Text>No posts found</Text>
        </View>
      )}
    </View>
  );
};
export default MediaOfYou;
