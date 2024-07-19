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
import { useRouter } from "expo-router";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "@tamagui/lucide-icons";
import { Avatar, SizableText, Text, View, XStack, YStack } from "tamagui";
import type z from "zod";

import type { sharedValidators } from "@oppfy/validators";

import {
  CommentsBottomSheet,
  PostActionsBottomSheet,
} from "~/components/BottomSheets";
import ShareBottomSheet from "~/components/BottomSheets/ShareBottomSheet";
import GradientHeart, {
  useHeartAnimations,
} from "~/components/Icons/GradientHeart";
import Mute, { useMuteAnimations } from "~/components/Icons/Mute";
import ReportPostActionSheet from "~/components/Sheets/ReportPostActionSheet";
import { useSession } from "~/contexts/SessionContext";
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

const PostItem = (props: PostItemProps) => {
  const { post, isSelfPost, isViewable } = props;
  const [isMuted, setIsMuted] = useState(false);
  const [status, _setStatus] = useState<"success" | "loading" | "error">(
    "success",
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [showViewMore, setShowViewMore] = useState(post.caption.length > 100);

  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const { getCurrentUserProfileId } = useSession();

  const router = useRouter();

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
    // TODO: Handle this bitch
    onError: (err) => {
      console.log(err);
    },
  });

  const unlikePost = api.post.unlikePost.useMutation({
    // TODO: Handle this bitch
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

  const handleRouteToNewUser = async (profileId: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const currentUserProfileId = await getCurrentUserProfileId();
    if (profileId === currentUserProfileId) {
      router.push({ pathname: "/(profile)/self-profile" });
      return;
    }
    router.push({
      pathname: "/(profile)/profile/[profile-id]/",
      params: { profileId: String(profileId) },
    });
  };

  return (
    <View
      flex={1}
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
              onPress={() => handleRouteToNewUser(post.recipientProfileId)}
            />
            <Avatar.Fallback backgroundColor="$blue10" />
          </Avatar>
          <YStack gap="$0.5" justifyContent="center">
            <TouchableOpacity
              onPress={() => handleRouteToNewUser(post.recipientProfileId)}
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
              onPress={async () => {
                await handleRouteToNewUser(post.authorProfileId);
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
            <ImagePost imageUrl={post.imageUrl}>
              {hearts.map((heart) => (
                <GradientHeart
                  key={heart.id}
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
                  key={heart.id}
                  gradient={heart.gradient}
                  position={heart.position}
                />
              ))}
              {/* Mute animation */}
              <View flex={1} justifyContent="center" alignItems="center">
                {muteIcons.map((mute) => (
                  <Mute key={mute.id} muted={mute.muted} />
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
                size={24}
                padding="$3"
                color={isLiked ? "red" : "$gray12"}
                fill="red"
                fillOpacity={isLiked ? 1 : 0}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity onPress={() => setCommentsBottomSheetVisible(true)}>
            <MessageCircle size={28} color="$gray12" />
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity onPress={() => setIsShareModalVisible(true)}>
            <Send size={28} color="$gray12" marginLeft="$-1" />
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
      </View>

      {/* Bottom Sheets & Action sheets*/}

      {commentsBottomSheetVisible && (
        <CommentsBottomSheet
          isSelfPost={isSelfPost}
          postId={post.postId}
          modalVisible={commentsBottomSheetVisible}
          setModalVisible={setCommentsBottomSheetVisible}
        />
      )}

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

      <ShareBottomSheet
        imageUrl={post.imageUrl}
        mediaType={post.mediaType}
        modalVisible={isShareModalVisible}
        setModalVisible={setIsShareModalVisible}
      />

      <ReportPostActionSheet
        title="Report Post"
        subtitle="Select reason"
        postId={post.postId}
        isVisible={isReportModalVisible}
        onCancel={() => {
          setIsReportModalVisible(false);
        }}
      />
    </View>
  );
};

export default PostItem;
