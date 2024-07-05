import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { Heart, MoreHorizontal, Send } from "@tamagui/lucide-icons";
import { Avatar, SizableText, Text, View, XStack, YStack } from "tamagui";
import type z from "zod";

import type { sharedValidators } from "@oppfy/validators";

import {
  CommentsBottomSheet,
  PostActionsBottomSheet,
} from "~/components/BottomSheets";
import GradientHeart, {
  useHeartAnimations,
} from "~/components/Icons/GradientHeart";
import ReportPostActionSheet from "~/components/Sheets/ReportPostActionSheet";
import { api } from "~/utils/api";
import FriendsCarousel from "./FriendsCarousel";
import ImagePost from "./ImagePost";
import ProfileBanner from "./ProfileBanner";
import VideoPost from "./VideoPost";

const { width: screenWidth } = Dimensions.get("window");

type Post = z.infer<typeof sharedValidators.media.post>;

interface PostItemProps {
  post: Post;
  isViewable: boolean;
}

const PostItem = (props: PostItemProps) => {
  const { post, isViewable } = props;
  const [isMuted, setIsMuted] = useState(false);
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
  const [likeCount, setLikeCount] = useState<number>(post.likesCount);
  const [commentsBottomSheetVisible, setCommentsBottomSheetVisible] =
    useState(false);
  const [postActionsBottomSheetVisible, setPostActionsBottomSheetVisible] =
    useState(false);

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

  // For the fuckin like button
  const heartPosition = useSharedValue({ x: 0, y: 0 });
  const buttonLikeScale = useSharedValue(1);

  const { hearts, addHeart } = useHeartAnimations();

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

  const [likeTimeout, setLikeTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleDoubleTapLike = async (x: number, y: number) => {
    addHeart(x, y); // Add one of those fucking heart animations
    handleLikeToggle({ doubleTap: true });
  };

  const howManyTimesDidTheMfHitTheLikeButton = useRef(0);

  const handleLikeToggle = ({ doubleTap }: { doubleTap: boolean }): void => {
    animateButton();
    if (isLiked && doubleTap) return;

    // Incremement this shit to keep of user's wasting their time
    howManyTimesDidTheMfHitTheLikeButton.current += 1;
    const clickCount = howManyTimesDidTheMfHitTheLikeButton.current;
    const ignoreIfSameAsCurrentState = clickCount % 2 === 0;

    const newIsLiked = !isLiked;

    // Optimistic update
    setIsLiked(newIsLiked);
    setLikeCount(newIsLiked ? likeCount + 1 : Math.max(likeCount - 1, 0));

    // Existing timeouts can fuck off
    if (likeTimeout) {
      clearTimeout(likeTimeout);
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
        setLikeTimeout(null);
      })();
    }, 3000);

    // Save the new timeout for later idiot
    setLikeTimeout(newTimeout);
  };

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      const { x, y } = { x: event.x, y: event.y };
      heartPosition.value = { x, y }; // Update position
      runOnJS(handleDoubleTapLike)(x, y);
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(setIsMuted)(!isMuted);
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

  const handleUserClicked = (profileId: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.navigate({
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
      backgroundColor="$gray2"
      marginBottom="$5"
    >
      <GestureDetector gesture={postInteractions}>
        <View aspectRatio={post.width / post.height} width="100%">
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
            </VideoPost>
          )}
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
                {post.recipientUsername ?? "@RecipientUsername"}
              </SizableText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                handleUserClicked(post.authorProfileId);
              }}
            >
              <XStack gap="$1.5" alignItems="center">
                <SizableText
                  size="$3"
                  lineHeight={15}
                  marginTop={0}
                  padding={0}
                >
                  📸
                </SizableText>
                <SizableText size="$2" lineHeight={15} fontWeight="bold">
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
              console.log("touched");
              // setIsReportModalVisible(true)
            }}
          >
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
            <TouchableOpacity
              onPress={() => setCommentsBottomSheetVisible(true)}
            >
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
            <TouchableOpacity
              onPress={() => handleLikeToggle({ doubleTap: false })}
            >
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
                <Send size={24} padding="$3" color="$gray12" />
              </View>
            </TouchableOpacity>
          </View>
        </XStack>

        {/* Comments and Likes */}
        <XStack flex={1} gap="$2">
          <View flex={4} alignItems="flex-start" paddingLeft="$2.5">
            <TouchableOpacity
              onPress={() => setCommentsBottomSheetVisible(true)}
            >
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
                {likeCount > 0
                  ? likeCount > 1
                    ? `${likeCount} likes`
                    : `${likeCount} like`
                  : ""}
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
        modalVisible={commentsBottomSheetVisible}
        setModalVisible={setCommentsBottomSheetVisible}
      />

      <PostActionsBottomSheet
        postId={post.postId}
        url={post.imageUrl}
        modalVisible={postActionsBottomSheetVisible}
        setModalVisible={setPostActionsBottomSheetVisible}
        setReportActionSheetVisible={setIsReportModalVisible}
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
    isLoading: isLoadingPostData,
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

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const posts = useMemo(
    () => postData?.pages.flatMap((page) => page.items),
    [postData],
  );

  const [refreshing, setRefreshing] = useState(false);

  const {
    data: profileData,
    isLoading: isLoadingProfileData,
    refetch: refetchProfileData,
  } = api.profile.getFullProfileSelf.useQuery();

  const {
    data: friendsData,
    isLoading: isLoadingFriendsData,
    refetch: refetchFriendsData,
  } = api.friend.paginateFriendsSelf.useInfiniteQuery(
    { pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProfileData(), refetchFriendsData()]);
    setRefreshing(false);
  }, [refetchFriendsData, refetchProfileData]);

  const friendItems = useMemo(
    () => friendsData?.pages.flatMap((page) => page.items) ?? [],
    [friendsData],
  );

  const [viewableItems, setViewableItems] = useState<number[]>([]);
  useEffect(() => {
    console.log(viewableItems);
  }, [viewableItems]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visibleItemIds = viewableItems
        .filter((token) => token.isViewable)
        .map((token) => token.item?.postId)
        .filter((id): id is number => id !== undefined);

      setViewableItems(visibleItemIds);
    },
    [],
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 40,
  };

  const FlashListHeader = () => {
    if (
      isLoadingProfileData ||
      isLoadingFriendsData ||
      profileData === undefined ||
      friendsData === undefined
    ) {
      return (
        <YStack gap="$5">
          <ProfileBanner loading />
          <FriendsCarousel loading />
        </YStack>
      );
    }
    return (
      <YStack gap="$5" marginBottom="$5">
        <YStack gap="$5">
          <ProfileBanner loading={false} data={profileData} />
          <FriendsCarousel
            loading={false}
            data={{
              friendCount: profileData.friendCount,
              friendItems: friendItems,
            }}
          />
        </YStack>
      </YStack>
    );
  };

  return (
    <View flex={1} width="100%" height="100%">
      <FlashList
        nestedScrollEnabled={true}
        data={posts}
        ListHeaderComponent={FlashListHeader}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        numColumns={1}
        onEndReached={handleOnEndReached}
        keyExtractor={(item) => {
          return item?.postId.toString() ?? "";
        }}
        renderItem={({ item }) => {
          if (item === undefined) {
            return null;
          }
          return (
            <>
              {isLoadingPostData ? (
                <>
                  <Text>Loading...</Text>
                </>
              ) : (
                <PostItem
                  post={item}
                  isViewable={viewableItems.includes(item.postId)}
                />
              )}
            </>
          );
        }}
        estimatedItemSize={screenWidth}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        extraData={viewableItems}
      />
    </View>
  );
};

export default MediaOfYou;
