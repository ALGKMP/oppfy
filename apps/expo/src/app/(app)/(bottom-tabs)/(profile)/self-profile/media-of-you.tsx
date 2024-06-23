import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, Modal, TouchableOpacity } from "react-native";
import {
  Gesture,
  GestureDetector,
  NativeViewGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  interpolate,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { Heart, Minus, Send, SendHorizontal } from "@tamagui/lucide-icons";
import { debounce, throttle } from "lodash";
import { Skeleton } from "moti/skeleton";
import {
  Avatar,
  Separator,
  SizableText,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";
import z from "zod";

import { sharedValidators } from "@oppfy/validators";

import { CommentsBottomSheet } from "~/components/Comments";
import { api } from "~/utils/api";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface PostItemProps {
  post: z.infer<typeof sharedValidators.media.post>;
}

const PostItem = (props: PostItemProps) => {
  const { post } = props;
  const [status, setStatus] = useState<"success" | "loading" | "error">(
    "success",
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [showViewMore, setShowViewMore] = useState(post.caption.length > 100);

  const utils = api.useUtils();
  const profile = utils.profile.getFullProfileSelf.getData();

  const {
    data: hasLiked,
    isLoading: isLoadingHasLiked,
    isError,
  } = api.post.hasliked.useQuery({ postId: post.postId });

  const [isLiked, setIsLiked] = useState<Boolean>(hasLiked ?? false);
  // const [fillHeart, setFillHeart] = useState(hasLiked ?? false); // Initialize fill state
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setIsLiked(hasLiked ?? false);
  }, [hasLiked]);

  const likePost = api.post.likePost.useMutation();
  const unlikePost = api.post.unlikePost.useMutation();

  const renderCaption = () => {
    const maxLength = 100; // Set max length for the caption
    if (post.caption.length <= maxLength || isExpanded) {
      return post.caption;
    }
    return `${post.caption.substring(0, maxLength)}...`;
  };

  // For the fuckin like button
  const imageLikeScale = useSharedValue(0);
  const buttonLikeScale = useSharedValue(1);

  const handleImageLikeAnimation = () => {
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
    setIsLiked(true); // Update the liked state
  };

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleImageLikeAnimation)();
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

  const handleButtonLikeAnimation = () => {
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
    setIsLiked(!isLiked);
    // setFillHeart(!fillHeart); // Toggle fill state
    throttledLikePost();
    // debouncedLikePost();
  };

  const handleLikePost = async () => {
    if (isLiked) {
      await unlikePost.mutateAsync({ postId: post.postId });
    } else {
      await likePost.mutateAsync({ postId: post.postId });
    }
  };

  const debouncedLikePost = useCallback(
    debounce(handleLikePost, 3000, { leading: false, trailing: true }),
    [isLiked],
  );

  const throttledLikePost = useCallback(
    throttle(handleLikePost, 3000, { leading: false, trailing: true }),
    [isLiked],
  );

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
    >
      <GestureDetector gesture={doubleTap}>
        <Image
          source={{ uri: post.imageUrl }}
          style={[
            {
              width: post.width,
              height: post.height,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <Animated.View style={[heartImageAnimatedStyle]}>
            <Heart size={100} color={"red"} fill={"red"} />
          </Animated.View>
        </Image>
      </GestureDetector>
      <XStack
        gap={"$2.5"}
        position="absolute"
        top={10}
        left={10}
        justifyContent="flex-start"
        alignContent="center"
      >
        <Avatar circular size="$5">
          <Avatar.Image
            accessibilityLabel="Cam"
            src={profile?.profilePictureUrl ?? ""}
          />
          <Avatar.Fallback backgroundColor="$blue10" />
        </Avatar>
        <YStack gap={"$1"} justifyContent="center">
          <TouchableOpacity>
            <SizableText
              size={"$3"}
              lineHeight={14}
              margin={0}
              padding={0}
              shadowRadius={3}
              shadowOpacity={0.5}
              fontWeight={"bold"}
            >
              {profile?.username ?? "@AuthorUsername"}
            </SizableText>
          </TouchableOpacity>
          <XStack gap={"$1"} alignItems="center">
            <SizableText size={"$3"} lineHeight={15} marginTop={0} padding={0}>
              📸
            </SizableText>
            <SizableText size={"$2"} lineHeight={15} color={"$gray2"}>
              posted by:
            </SizableText>

            <TouchableOpacity>
              <SizableText
                size={"$2"}
                lineHeight={15}
                fontWeight={"bold"}
                color={"$blue9"}
              >
                {profile?.username ?? "@RecipientUsername"}
              </SizableText>
            </TouchableOpacity>
          </XStack>
        </YStack>
      </XStack>

      {/* Under Post */}
      <View
        flex={1}
        alignSelf={"stretch"}
        padding={"$2"}
        paddingTop={"$3"}
        borderBottomRightRadius={"$8"}
        borderBottomLeftRadius={"$8"}
        backgroundColor={"$gray2"}
        marginBottom={"$5"}
      >
        <XStack gap={"$2"} alignItems="flex-start">
          {/* Comment Button */}
          <View flex={4} justifyContent="center">
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <View
                flex={1}
                justifyContent="flex-start"
                padding={"$2.5"}
                borderRadius={"$7"}
                backgroundColor={"$gray5"}
              >
                <Text fontWeight={"bold"} color={"$gray9"}>
                  Comment
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {/* Like Button */}
          <View flex={1} justifyContent="center">
            <TouchableOpacity
              onPress={handleButtonLikeAnimation}
              // activeOpacity={1} // Uncomment this line to disable the opacity change on press
            >
              <View
                justifyContent="center"
                alignItems="center"
                borderRadius={"$7"}
                padding={"$2"}
                backgroundColor={"$gray5"}
              >
                <Animated.View style={[heartButtonAnimatedStyle]}>
                  <Heart
                    size={24}
                    padding={"$3"}
                    color={isLiked ? "red" : "$gray12"}
                    fill={"red"}
                    // fillOpacity={fillHeart ? 1 : 0}
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
                borderRadius={"$7"}
                backgroundColor={"$gray5"}
              >
                <SendHorizontal size={24} padding={"$3"} color="$gray12" />
              </View>
            </TouchableOpacity>
          </View>
        </XStack>

        {/* Comments and Likes */}
        <XStack flex={1} gap="$2">
          <View flex={4} alignItems="flex-start" paddingLeft={"$2.5"}>
            <TouchableOpacity>
              <SizableText size={"$2"} fontWeight={"bold"} color={"$gray10"}>
                102 other comments
              </SizableText>
            </TouchableOpacity>
          </View>
          <View flex={2} alignItems={"flex-start"}>
            <TouchableOpacity>
              <SizableText size={"$2"} fontWeight={"bold"} color={"$gray10"}>
                1k likes
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
                <Text color={"$gray10"}> more</Text>
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

    return postData.pages.reduce(
      (acc, page) => acc + (page.items ?? []).length,
      0,
    );
  }, [postData]);

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const posts = useMemo(
    () => postData?.pages.flatMap((page) => page.items ?? []),
    [postData],
  );

  const placeholderData = useMemo(() => {
    return Array.from({ length: 20 }, () => null);
  }, []);

  return (
    <View flex={1}>
      <Separator margin={10} borderColor={"white"} />
      {isLoading ? (
        <Skeleton.Group show={true}>
          <Skeleton width={"100%"} height={100} />
        </Skeleton.Group>
      ) : itemCount ? (
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
        <Text>No posts found</Text>
      )}
    </View>
  );
};
export default MediaOfYou;
