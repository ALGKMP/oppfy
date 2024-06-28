import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, TouchableOpacity } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
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
import { useVideoPlayer, VideoView } from "expo-video";
import type { ViewToken } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import { Heart, MoreHorizontal, SendHorizontal } from "@tamagui/lucide-icons";
import { throttle } from "lodash";
import {
  Avatar,
  Button,
  getToken,
  ListItemTitle,
  Paragraph,
  Separator,
  SizableText,
  Spacer,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";
import type z from "zod";

import { abbreviatedNumber } from "@oppfy/utils";
import type { sharedValidators } from "@oppfy/validators";

import { CommentsBottomSheet } from "~/components/BottomSheets";
import CardContainer from "~/components/Containers/CardContainer";
import ReportPostActionSheet from "~/components/Sheets/ReportPostActionSheet";
import { Skeleton } from "~/components/Skeletons";
import StatusRenderer from "~/components/StatusRenderer";
import { useUploadProfilePicture } from "~/hooks/media";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const { width: screenWidth } = Dimensions.get("window");

interface PostItemProps {
  post: z.infer<typeof sharedValidators.media.post>;
  isViewable: boolean;
}

type ProfileData = RouterOutputs["profile"]["getFullProfileSelf"];
type FriendItems = RouterOutputs["friend"]["paginateFriendsSelf"]["items"];

interface LoadingProps {
  loading: true;
}

interface ProfileLoadedProps {
  loading: false;
  data: ProfileData;
}
type ProfileProps = LoadingProps | ProfileLoadedProps;

const PostItem = (props: PostItemProps) => {
  const { post, isViewable } = props;
  const [status, _setStatus] = useState<"success" | "loading" | "error">(
    "success",
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [showViewMore, setShowViewMore] = useState(post.caption.length > 100);

  useEffect(() => {
    console.log("FUCK FUCK FOR FUCKS SAKES");
  }, [isViewable]);

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

  const videoSource =
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
  });

  // useEffect(() => {
  //   const subscription = player.addListener("playingChange", (isPlaying) => {
  //     setIsPlaying(isPlaying);
  //   });

  //   return () => {
  //     subscription.remove();
  //   };
  // }, [player]);

  useEffect(() => {
    console.log("isViewable", isViewable);
    if (isViewable) {
      player.play();
    } else {
      player.pause();
    }
  }, [isViewable, player]);

  useEffect(() => {
    const subscription = player.addListener("playingChange", (isPlaying) => {
      setIsPlaying(isPlaying);
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

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
          {post.mediaType === "image" ? (
            <Image
              source={{ uri: post.imageUrl }}
              style={[
                {
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
          ) : (
            <>
              <VideoView
                ref={videoRef}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 20,
                }}
                contentFit="cover"
                player={player}
                nativeControls={false}
              />
            </>
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
                <SizableText size="$2" lineHeight={15} fontWeight="bold">
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
                {post.likesCount > 0
                  ? post.likesCount > 1
                    ? `${post.likesCount} likes`
                    : `${post.likesCount} like`
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

  const placeholderData = useMemo(() => {
    return Array.from({ length: 20 }, () => null);
  }, []);

  const [viewableItems, setViewableItems] = useState<number[]>([]);
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      console.log("shit changing");
      const visibleItemIds = viewableItems
        .filter((token) => token.isViewable)
        .map((token) => token.item?.postId)
        .filter((id): id is number => id !== undefined);

      console.log("visibleItemIds", visibleItemIds);

      setViewableItems(visibleItemIds);
    },
    [],
  );

  const viewabilityConfig = {
    minimumViewTime: 200,
    itemVisiblePercentThreshold: 30,
  };

  const FlashListHeader = () => {
    const scrollY = useSharedValue(0);
    const profileAnimatedStyle = useAnimatedStyle(() => {
      const minimalOpacity = Math.max(1 - scrollY.value / 400, 0);
      return {
        opacity: minimalOpacity,
      };
    });
    if (
      isLoadingProfileData ||
      isLoadingFriendsData ||
      profileData === undefined ||
      friendsData === undefined
    ) {
      return (
        <YStack gap="$5">
          <Profile loading />
          <Friends loading />
        </YStack>
      );
    }
    return (
      <YStack gap="$5">
        <Animated.View style={profileAnimatedStyle}>
          <YStack gap="$5">
            <Profile loading={false} data={profileData} />
            <Friends
              loading={false}
              data={{
                friendCount: profileData.friendCount,
                friendItems: friendItems,
              }}
            />
          </YStack>
        </Animated.View>
      </YStack>
    );
  };

  return (
    <View flex={1}>
      {itemCount ? (
        <FlashList
          data={isLoading ? placeholderData : posts}
          ListHeaderComponent={FlashListHeader}
          refreshing={refreshing}
          onRefresh={onRefresh}
          numColumns={1}
          onEndReached={handleOnEndReached}
          keyExtractor={(item) => {
            return item?.postId.toString() ?? "";
          }}
          renderItem={({ item }) => {
            if (item === null || item === undefined) {
              return null;
            }
            return (
              <PostItem
                key={item.postId.toString()}
                post={item}
                isViewable={viewableItems.includes(item.postId)}
              />
            );
          }}
          estimatedItemSize={screenWidth}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          extraData={viewableItems}
          nestedScrollEnabled={true}
        />
      ) : (
        <View flex={1} justifyContent="center" alignItems="center">
          <Text>No posts found</Text>
        </View>
      )}
    </View>
  );
};

const Profile = (props: ProfileProps) => {
  const router = useRouter();

  const { pickAndUploadImage } = useUploadProfilePicture({
    optimisticallyUpdate: true,
  });

  const onFollowingListPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/self-connections/following-list");
  };

  const onFollowerListPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/self-connections/follower-list");
  };

  const onEditProfilePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/edit-profile");
  };

  const onShareProfilePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: add sharing functionality with deep linking
  };

  return (
    <YStack
      padding="$4"
      paddingBottom={0}
      alignItems="center"
      backgroundColor="$background"
      gap="$4"
    >
      <View marginBottom={-28} alignItems="center">
        <StatusRenderer
          data={!props.loading ? props.data.profilePictureUrl : undefined}
          loadingComponent={<Skeleton circular size={140} />}
          successComponent={(url) => (
            <TouchableOpacity onPress={pickAndUploadImage}>
              <Avatar circular size={140} bordered>
                <Avatar.Image src={url} />
                <Avatar.Fallback />
              </Avatar>
            </TouchableOpacity>
          )}
        />
      </View>

      <XStack justifyContent="space-between" alignItems="center" width="100%">
        <YStack alignItems="flex-start" gap="$2">
          <StatusRenderer
            data={!props.loading ? props.data.name : undefined}
            loadingComponent={<Skeleton width={80} height={20} />}
            successComponent={(name) => (
              <SizableText
                size="$5"
                fontWeight="bold"
                textAlign="left"
                lineHeight={0}
              >
                {name}
              </SizableText>
            )}
          />

          <StatusRenderer
            data={!props.loading ? props.data.bio : undefined}
            loadingComponent={<Skeleton width={150} height={20} />}
            successComponent={(bio) => (
              <Paragraph theme="alt1" textAlign="left" lineHeight={0}>
                {bio}
              </Paragraph>
            )}
          />
        </YStack>

        <YStack alignItems="flex-end" gap="$2">
          <StatusRenderer
            data={!props.loading ? props.data.followingCount : undefined}
            loadingComponent={<Skeleton width={80} height={20} />}
            successComponent={(count) => (
              <TouchableOpacity onPress={onFollowingListPress}>
                <Stat label="Following" value={abbreviatedNumber(count)} />
              </TouchableOpacity>
            )}
          />
          <StatusRenderer
            data={!props.loading ? props.data.followerCount : undefined}
            loadingComponent={<Skeleton width={150} height={20} />}
            successComponent={(count) => (
              <TouchableOpacity onPress={onFollowerListPress}>
                <Stat label="Followers" value={abbreviatedNumber(count)} />
              </TouchableOpacity>
            )}
          />
        </YStack>
      </XStack>

      <XStack gap="$4">
        <StatusRenderer
          data={!props.loading ? props.data.username : undefined}
          loadingComponent={
            <View flex={1}>
              <Skeleton width="100%" height={44} radius={20} />
            </View>
          }
          successComponent={() => (
            <Button flex={1} borderRadius={20} onPress={onEditProfilePress}>
              Edit Profile
            </Button>
          )}
        />
        <StatusRenderer
          data={!props.loading ? props.data.username : undefined}
          loadingComponent={
            <View flex={1}>
              <Skeleton width="100%" height={44} radius={20} />
            </View>
          }
          successComponent={() => (
            <Button flex={1} borderRadius={20} onPress={onShareProfilePress}>
              Share Profile
            </Button>
          )}
        />
      </XStack>
    </YStack>
  );
};

interface FriendsData {
  friendCount: number;
  friendItems: FriendItems;
}

interface FriendsLoadedProps {
  loading: false;
  data: FriendsData;
}

type FriendsProps = LoadingProps | FriendsLoadedProps;

const Friends = (props: FriendsProps) => {
  const router = useRouter();

  const showMore =
    !props.loading && props.data.friendItems.length < props.data.friendCount;

  const handleFriendClicked = (profileId: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.navigate({
      pathname: "/(profile)/profile/[profile-id]/",
      params: { profileId: String(profileId) },
    });
  };

  const handleShowMoreFriends = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/self-connections/friend-list");
  };

  const throttledHandleAction = useRef(
    throttle(handleShowMoreFriends, 300, { leading: true, trailing: false }),
  ).current;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!showMore) return;

      const { contentSize, contentOffset, layoutMeasurement } =
        event.nativeEvent;

      const contentWidth = contentSize.width;
      const offsetX = contentOffset.x;
      const layoutWidth = layoutMeasurement.width;

      // Check if within the threshold from the end
      if (offsetX + layoutWidth - 80 >= contentWidth) {
        throttledHandleAction();
      }
    },
    [showMore, throttledHandleAction],
  );

  useEffect(() => throttledHandleAction.cancel(), [throttledHandleAction]);

  const renderLoadingSkeletons = () => (
    <CardContainer>
      <XStack gap="$2">
        {PLACEHOLDER_DATA.map((item, index) => (
          <Skeleton key={index} circular size={70} />
        ))}
      </XStack>
    </CardContainer>
  );

  const renderSuggestions = () => (
    <CardContainer>
      <YStack gap="$2">
        <Text fontWeight="600">Find Friends</Text>
        <Button size="$3.5">@oxy add recommendations here</Button>
      </YStack>
    </CardContainer>
  );

  const renderFriendList = (data: FriendsData) => (
    <CardContainer paddingHorizontal={0}>
      <YStack gap="$2">
        <TouchableOpacity onPress={handleShowMoreFriends}>
          <ListItemTitle paddingLeft="$3">
            Friends ({abbreviatedNumber(data.friendCount)})
          </ListItemTitle>
        </TouchableOpacity>

        <FlashList
          data={data.friendItems}
          horizontal
          estimatedItemSize={70}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleFriendClicked(item.profileId)}
            >
              <YStack gap="$1.5">
                <Avatar circular size="$6" bordered>
                  <Avatar.Image src={item.profilePictureUrl} />
                </Avatar>
                <Text fontWeight="600" textAlign="center">
                  {item.username}
                </Text>
              </YStack>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            showMore ? (
              <View
                marginRight={-100}
                justifyContent="center"
                alignItems="center"
              >
                <SizableText color="$blue7" fontWeight="600">
                  See more
                </SizableText>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <Spacer size="$2" />}
          contentContainerStyle={{
            paddingHorizontal: getToken("$3", "space") as number,
          }}
          ListFooterComponentStyle={{
            justifyContent: "center",
            alignItems: "center",
          }}
        />
      </YStack>
    </CardContainer>
  );

  if (props.loading) {
    return renderLoadingSkeletons();
  }

  if (props.data.friendCount === 0) {
    return renderSuggestions();
  }

  return renderFriendList(props.data);
};

interface StatProps {
  label: string;
  value: string | number;
}

const Stat = (props: StatProps) => (
  <XStack gap="$1">
    <Text theme="alt1" lineHeight={0}>
      {props.label}{" "}
    </Text>
    <Text fontWeight="bold" lineHeight={0}>
      {props.value}
    </Text>
  </XStack>
);

export default MediaOfYou;
