import React, { useEffect, useRef, useState } from "react";
import { Dimensions, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import PagerView from "react-native-pager-view";
import Animated, {
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter, useSegments } from "expo-router";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "@tamagui/lucide-icons";
import { format, formatDistanceToNow } from "date-fns";
import { Avatar, SizableText, Text, View, XStack, YStack } from "tamagui";
import type z from "zod";

import type { sharedValidators } from "@oppfy/validators";

import {
  CommentsBottomSheet,
  CommentsTestBottomSheet,
  CommentsTestBottomSheet2,
  PostActionsBottomSheet,
} from "~/components/BottomSheets";
import GradientHeart, {
  useHeartAnimations,
} from "~/components/Icons/GradientHeart";
import Mute, { useMuteAnimations } from "~/components/Icons/Mute";
import ReportPostActionSheet from "~/components/Sheets/ReportPostActionSheet";
import { useSession } from "~/contexts/SessionContext";
import useShare from "~/hooks/useShare";
import useView from "~/hooks/useView";
import { api } from "~/utils/api";
import { ActionSheet } from "../Sheets";
import ImagePost from "./ImagePost";
import VideoPost from "./VideoPost";

type Post = z.infer<typeof sharedValidators.media.post>;

interface PostItemProps {
  post: Post;
  isSelfPost: boolean;
  isViewable: boolean;
}

const PostItem = React.memo((props: PostItemProps) => {
  const { post, isSelfPost, isViewable } = props;
  const [isMuted, setIsMuted] = useState(false);
  const [status, _setStatus] = useState<"success" | "loading" | "error">(
    "success",
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [showViewMore, setShowViewMore] = useState(post.caption.length > 100);

  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const { isSharing, shareImage } = useShare();
  const { viewPost } = useView();

  useEffect(() => {
    console.log(`${post.postId} is viewable: ${isViewable}`);
    if (isViewable) {
      viewPost(post.postId);
    }
  }, [isViewable, post.postId, viewPost]);

  const router = useRouter();
  const { user } = useSession();

  const {
    data: hasLiked,
    isLoading: isLoadingHasLiked,
    isError,
  } = api.post.hasliked.useQuery({ postId: post.postId });

  const [isLiked, setIsLiked] = useState<boolean>(hasLiked ?? false);
  const [likeCount, setLikeCount] = useState<number>(post.likesCount);
  const [likeThrottleTimeout, setLikeThrottleTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const howManyTimesDidTheMfHitTheLikeButton = useRef(0);

  const [commentsBottomSheetVisible, setCommentsBottomSheetVisible] =
    useState(false);
  const [postActionsBottomSheetVisible, setPostActionsBottomSheetVisible] =
    useState(false);

  // For the fuckin like button
  const heartPosition = useSharedValue({ x: 0, y: 0 });
  const buttonLikeScale = useSharedValue(1);

  const { hearts, addHeart } = useHeartAnimations();
  const { muteIcons, addMute } = useMuteAnimations();

  useEffect(() => {
    setIsLiked(hasLiked ?? false);
  }, [hasLiked]);

  const likePost = api.post.likePost.useMutation({
    onError: (err) => {
      console.log(err);
    },
  });

  const unlikePost = api.post.unlikePost.useMutation({
    onError: (err) => {
      console.log(err);
    },
  });

  const utils = api.useUtils();

  const deletePost = api.post.deletePost.useMutation({
    onMutate: async (newData) => {
      await utils.post.paginatePostsOfUserSelf.invalidate();

      const prevData = utils.post.paginatePostsOfUserSelf.getInfiniteData();
      if (!prevData) return;

      utils.post.paginatePostsOfUserSelf.setInfiniteData(
        {},
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item?.postId != newData.postId),
          })),
        },
      );
      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (!ctx) return;
      utils.post.paginatePostsOfUserSelf.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      await utils.post.paginatePostsOfUserSelf.invalidate();
    },
  });

  const handleLikeToggle = ({ doubleTap }: { doubleTap: boolean }): void => {
    animateButton();
    if (isLiked && doubleTap) return;

    // Incremement this shit to keep track of user's wasting their time
    howManyTimesDidTheMfHitTheLikeButton.current += 1;
    const clickCount = howManyTimesDidTheMfHitTheLikeButton.current;
    const ignoreIfSameAsCurrentState = clickCount % 2 === 0;

    const newIsLiked = !isLiked;

    // Optimistic update
    setIsLiked(newIsLiked);
    setLikeCount(newIsLiked ? likeCount + 1 : Math.max(likeCount - 1, 0));

    // Existing timeouts can fuck off
    if (likeThrottleTimeout) {
      clearTimeout(likeThrottleTimeout);
    }

    // Set a new timeout
    const newTimeout: NodeJS.Timeout = setTimeout(() => {
      void (async () => {
        try {
          if (ignoreIfSameAsCurrentState) {
            console.log(
              `ignoring because the user is fucking spamming the like button on post ${post.postId}`,
            );
            return;
          }
          if (newIsLiked) {
            console.log(newIsLiked);
            await likePost.mutateAsync({ postId: post.postId });
            console.log(`liked post: ${post.postId}`);
          } else {
            await unlikePost.mutateAsync({ postId: post.postId });
            console.log(`unliked post: ${post.postId}`);
          }

          howManyTimesDidTheMfHitTheLikeButton.current = 0;
        } catch (error) {
          console.log(error);
        }

        // Clear the fucking timeout after execution
        setLikeThrottleTimeout(null);
      })();
    }, 3000);

    // Save the new timeout for later idiot
    setLikeThrottleTimeout(newTimeout);
  };

  const animateButton = () => {
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
  };

  const handleDoubleTapLike = (x: number, y: number) => {
    addHeart(x, y); // Add one of those fucking heart animations
    handleLikeToggle({ doubleTap: true });
  };

  const handleTapMute = () => {
    addMute(!isMuted);
    setIsMuted(!isMuted);
  };

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      const { x, y } = { x: event.x, y: event.y };
      heartPosition.value = { x, y }; // Update position
      runOnJS(handleDoubleTapLike)(x, y);
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handleTapMute)();
  });

  // TODO: Not sure what I wanna do. Either pause the video, or make the video full screen
  const longHold = Gesture.LongPress().onEnd(() => {
    console.log("long hold");
  });

  const postInteractions = Gesture.Exclusive(doubleTap, tapGesture, longHold);

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

  const formatPostDate = (createdAt: Date) => {
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays < 7) {
      return formatDistanceToNow(createdAt, { addSuffix: true });
    } else {
      return format(createdAt, "MMMM d");
    }
  };

  const routeSegments = useSegments();

  const handleRouteToNewUser = (userId: string, username: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (user?.uid === userId) {
      router.push({ pathname: `/${routeSegments[2]}/self-profile` });
      return;
    }
    router.push({
      pathname: `/${routeSegments[2]}/profile/[userId]`,
      params: { userId, username },
    });
  };

  return (
    <View
      flex={1}
      // bg="$gray2"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      borderRadius={20}
      marginBottom="$2"
    >
      <XStack
        flex={1}
        // margin="$2"
        padding="$2.5"
        width="100%"
        justifyContent="space-between"
        alignContent="center"
      >
        <XStack gap="$2.5">
          <Avatar circular size="$3">
            <Avatar.Image
              accessibilityLabel="Cam"
              src={post.recipientProfilePicture}
              onPress={() =>
                handleRouteToNewUser(
                  post.recipientId,
                  post.recipientUsername ?? "",
                )
              }
            />
            <Avatar.Fallback backgroundColor="$blue10" />
          </Avatar>
          <YStack gap="$0.5" justifyContent="center">
            <TouchableOpacity
              onPress={() =>
                handleRouteToNewUser(
                  post.recipientId,
                  post.recipientUsername ?? "",
                )
              }
            >
              <SizableText
                size="$2"
                lineHeight={14}
                margin={0}
                padding={0}
                shadowRadius={3}
                shadowOpacity={0.5}
                fontWeight="bold"
              >
                {post.recipientUsername ?? "@RecipientUsername"}
              </SizableText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                handleRouteToNewUser(post.authorId, post.authorUsername ?? "");
              }}
            >
              <XStack gap="$1.5" alignItems="center">
                <SizableText
                  size="$2"
                  lineHeight={15}
                  marginTop={0}
                  padding={0}
                >
                  📸
                </SizableText>
                <SizableText size="$1" lineHeight={15}>
                  posted by:
                </SizableText>

                <SizableText
                  size="$2"
                  lineHeight={15}
                  fontWeight="bold"
                  color="$blue9"
                >
                  {post.authorUsername ?? "@AuthorUsername"}
                </SizableText>
              </XStack>
            </TouchableOpacity>
          </YStack>
        </XStack>
        <View justifyContent="center" alignItems="center">
          <TouchableOpacity
            onPress={() => {
              setPostActionsBottomSheetVisible(true);
            }}
          >
            <MoreHorizontal size={24} color="$gray12" />
          </TouchableOpacity>
        </View>
      </XStack>

      <GestureDetector gesture={postInteractions}>
        <View
          width="100%"
          aspectRatio={Math.max(post.width / post.height, 9 / 12)}
        >
          {post.mediaType === "image" ? (
            <ImagePost postId={post.postId} imageUrl={post.imageUrl}>
              {hearts.map((heart) => (
                <GradientHeart
                  key={heart.id} // This key is not tied to the item prop in any way, so it does not hinder peformance (w due for a win)
                  gradient={heart.gradient}
                  position={heart.position}
                />
              ))}
            </ImagePost>
          ) : (
            <VideoPost
              videoSource={post.imageUrl}
              isViewable={isViewable}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
            >
              {hearts.map((heart) => (
                <GradientHeart
                  key={heart.id} // This key is not tied to the item prop in any way, so it does not hinder peformance (w due for a win)
                  gradient={heart.gradient}
                  position={heart.position}
                />
              ))}
              {/* Mute animation */}
              <View flex={1} justifyContent="center" alignItems="center">
                {muteIcons.map((mute) => (
                  <Mute
                    key={mute.id} // This key is not tied to the item prop in any way, so it does not hinder peformance (w due for a win)
                    muted={mute.muted}
                  />
                ))}
              </View>
            </VideoPost>
          )}
        </View>
      </GestureDetector>
      {/* Under Post */}
      <View flex={1} alignSelf="stretch" padding="$2.5" paddingTop="$3">
        <XStack gap="$4" alignItems="center" marginBottom="$2">
          {/* Like Button */}
          <TouchableOpacity
            onPress={() => handleLikeToggle({ doubleTap: false })}
          >
            <Animated.View style={[heartButtonAnimatedStyle]}>
              <Heart
                size="$2"
                padding="$3"
                color={isLiked ? "red" : "$gray12"}
                fill="red"
                fillOpacity={isLiked ? 1 : 0}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity onPress={() => setCommentsBottomSheetVisible(true)}>
            <MessageCircle size="$2" color="$gray12" />
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            onPress={() => shareImage({ uri: post.imageUrl })} // TODO: Add loading spinner on this
            // setIsShareModalVisible(true)}
          >
            <Send size={26} color="$gray12" marginLeft="$-1.5" />
          </TouchableOpacity>
        </XStack>

        {/* Likes Count */}
        {likeCount > 0 && (
          <TouchableOpacity>
            <SizableText size="$3" fontWeight="bold" marginBottom="$1">
              {likeCount > 0
                ? `${likeCount} ${likeCount === 1 ? "like" : "likes"}`
                : ""}
            </SizableText>
          </TouchableOpacity>
        )}

        {/* Caption */}
        {post.caption && (
          <View flex={1} alignItems="flex-start">
            <TouchableOpacity
              onPress={() => {
                setIsExpanded(!isExpanded);
                setShowViewMore(false);
              }}
            >
              <Text>
                <Text fontWeight="bold">{post.authorUsername} </Text>
                <Text numberOfLines={isExpanded ? 0 : 2}>
                  {renderCaption()}
                  {showViewMore && !isExpanded && (
                    <Text color="$gray10"> more</Text>
                  )}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Comments Count */}
        <TouchableOpacity onPress={() => setCommentsBottomSheetVisible(true)}>
          <SizableText size="$3" color="$gray10" marginTop="$1">
            {post.commentsCount > 0
              ? `View ${post.commentsCount > 1 ? "all " : ""}${post.commentsCount} ${post.commentsCount === 1 ? "comment" : "comments"}`
              : "Be the first to comment"}
          </SizableText>
        </TouchableOpacity>

        {/* Post Date */}
        <SizableText size="$2" color="$gray10" marginTop="$1">
          {formatPostDate(new Date(post.createdAt))}
        </SizableText>
      </View>

      {/* Bottom Sheets & Action sheets*/}
      {commentsBottomSheetVisible && (
        <CommentsBottomSheet
          isSelfPost={isSelfPost}
          userIdOfPostRecipient={post.recipientId}
          postId={post.postId}
          modalVisible={commentsBottomSheetVisible}
          setModalVisible={setCommentsBottomSheetVisible}
        />
        // <CommentsTestBottomSheet2
        //   isSelfPost={isSelfPost}
        //   userIdOfPostRecipient={post.recipientId}
        //   postId={post.postId}
        //   modalVisible={commentsBottomSheetVisible}
        //   setModalVisible={setCommentsBottomSheetVisible}
        // />

        // <CommentsTestBottomSheet
        //   postId={post.postId}
        //   modalVisible={commentsBottomSheetVisible}
        //   setModalVisible={setCommentsBottomSheetVisible}
        // />
      )}

      {postActionsBottomSheetVisible && (
        <PostActionsBottomSheet
          postId={post.postId}
          isSelfPost={isSelfPost}
          mediaType={post.mediaType}
          url={post.imageUrl}
          modalVisible={postActionsBottomSheetVisible}
          setModalVisible={setPostActionsBottomSheetVisible}
          setReportActionSheetVisible={setIsReportModalVisible}
          setDeleteActionSheetVisible={setIsDeleteModalVisible}
        />
      )}

      {postActionsBottomSheetVisible && (
        <ActionSheet
          title="Delete Post"
          subtitle="Are you sure you want to delete this post? This action cannot be undone!"
          buttonOptions={[
            {
              text: "Delete Post",
              textProps: {
                color: "$red9",
              },
              onPress: () => {
                void deletePost.mutateAsync({ postId: post.postId });
              },
            },
          ]}
          isVisible={isDeleteModalVisible}
          onCancel={() => {
            setIsDeleteModalVisible(false);
          }}
        />
      )}

      {/* {isShareModalVisible && (
        <ShareBottomSheet
          postId={post.postId}
          imageUrl={post.imageUrl}
          mediaType={post.mediaType}
          modalVisible={isShareModalVisible}
          setModalVisible={setIsShareModalVisible}
        />
      )} */}

      {isReportModalVisible && (
        <ReportPostActionSheet
          title="Report Post"
          subtitle="Select reason"
          postId={post.postId}
          isVisible={isReportModalVisible}
          onCancel={() => {
            setIsReportModalVisible(false);
          }}
        />
      )}
    </View>
  );
});

export default PostItem;
