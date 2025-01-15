import React, { useCallback, useRef, useState } from "react";
import { TouchableOpacity } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { ResizeMode, Video } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { Circle, getToken, SizableText, View, XStack, YStack } from "tamagui";

import Skeleton from "~/components/Skeletons/Skeleton";
import { Paragraph, Text } from "~/components/ui";
import { useAudio } from "~/contexts/AudioContext";
import useRouteProfile from "~/hooks/useRouteProfile";
import { useLikePost } from "../../hooks/post/useLikePost";
import Avatar from "../Avatar";
import GradientHeart, { useHeartAnimations } from "../Icons/GradientHeart";
import Mute, { useMuteAnimations } from "../Icons/Mute";
import CommentButton from "./CommentButton";
import CommentsCount from "./CommentsCount";
import LikeButton from "./LikeButton";
import MorePostOptionsButton from "./MorePostOptionsButton";
import PostCaption from "./PostCaption";
import PostDate from "./PostDate";
import ShareButton from "./ShareButton";
import { FloatingComments } from './FloatingComments';

type ProfilePicture = ImageSourcePropType | string | undefined | null;

interface Self {
  id: string;
  username: string;
  profilePicture: ProfilePicture;
}

interface Author {
  id: string;
  username: string;
  profilePicture: ProfilePicture;
}

interface Recipient {
  id: string;
  username: string;
  profilePicture: ProfilePicture;
}

interface MediaDimensions {
  width: number;
  height: number;
}

interface Media {
  id: string;
  type: "image" | "video";
  url: string;
  isViewable: boolean;
  dimensions: MediaDimensions;
  recipient: Recipient;
}

interface Stats {
  likes: number;
  comments: number;
  hasLiked: boolean;
}

export interface PostData {
  postId: string;
  createdAt: Date;
  caption: string;
  self: Self;
  author: Author;
  recipient: Recipient;
  media: Media;
  stats: Stats;
}

type PostCardProps = PostData & {
  endpoint: "self-profile" | "other-profile" | "single-post" | "home-feed";
};

const PostCard = (props: PostCardProps) => {
  const { routeProfile } = useRouteProfile();

  return (
    <YStack marginVertical="$2" overflow="hidden">
      {/* Media Content with Overlays */}
      <View>
        {props.media.type === "image" ? (
          <ImageComponent
            endpoint={props.endpoint}
            media={props.media}
            stats={props.stats}
          />
        ) : (
          <VideoPlayer
            endpoint={props.endpoint}
            media={props.media}
            stats={props.stats}
          />
        )}

        {/* Top Gradient Overlay */}
        <LinearGradient
          colors={["rgba(0,0,0,0.5)", "transparent"]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 120,
            zIndex: 1,
          }}
        />

        {/* Bottom Gradient Overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 160,
            zIndex: 1,
          }}
        />

        {/* Top Header - Overlaid on image */}
        <XStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          paddingHorizontal="$4"
          paddingVertical="$4"
          alignItems="center"
          justifyContent="space-between"
          zIndex={2}
        >
          <XStack gap="$3" alignItems="center">
            <TouchableOpacity
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                routeProfile({
                  userId: props.author.id,
                  username: props.author.username,
                });
              }}
            >
              <Avatar source={props.author.profilePicture} size={44} bordered />
            </TouchableOpacity>

            <YStack>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  routeProfile({
                    userId: props.author.id,
                    username: props.author.username,
                  });
                }}
              >
                <Text
                  color="white"
                  fontWeight="600"
                  fontSize="$5"
                  shadowColor="black"
                  shadowOffset={{ width: 1, height: 1 }}
                  shadowOpacity={0.4}
                  shadowRadius={3}
                >
                  {props.author.username}
                </Text>
              </TouchableOpacity>
              <PostDate createdAt={props.createdAt} light />
            </YStack>
          </XStack>

          <XStack alignItems="center" justifyContent="flex-end" width="$5">
            <MorePostOptionsButton
              postId={props.postId}
              recipientUserId={props.recipient.id}
              mediaUrl={props.media.url}
              light
              style={{ position: "relative", right: 0, bottom: 0 }}
            />
          </XStack>
        </XStack>

        {/* Floating Action Buttons - Right side */}
        <YStack
          position="absolute"
          right={0}
          bottom={24}
          paddingRight="$4"
          gap="$5"
          zIndex={2}
          alignItems="flex-end"
        >
          {/* Like Button */}
          <GlassButton expanded={(props.stats.likes ?? 0) > 0}>
            {(props.stats.likes ?? 0) > 0 ? (
              <>
                <Text
                  color="white"
                  fontWeight="600"
                  fontSize="$4"
                  textAlign="center"
                  shadowColor="black"
                  shadowOffset={{ width: 1, height: 1 }}
                  shadowOpacity={0.5}
                  shadowRadius={3}
                >
                  {props.stats.likes >= 1000000
                    ? `${(props.stats.likes / 1000000).toFixed(1)}M`
                    : props.stats.likes >= 1000
                      ? `${(props.stats.likes / 1000).toFixed(1)}K`
                      : props.stats.likes}
                </Text>
                <LikeButton
                  postId={props.postId}
                  endpoint={props.endpoint}
                  initialHasLiked={props.stats.hasLiked ?? false}
                  light
                  compact
                />
              </>
            ) : (
              <LikeButton
                postId={props.postId}
                endpoint={props.endpoint}
                initialHasLiked={props.stats.hasLiked ?? false}
                light
                compact
              />
            )}
          </GlassButton>

          {/* Comment Button */}
          <GlassButton expanded={(props.stats.comments ?? 0) > 0}>
            {(props.stats.comments ?? 0) > 0 ? (
              <>
                <Text
                  color="white"
                  fontWeight="600"
                  fontSize="$4"
                  textAlign="center"
                  shadowColor="black"
                  shadowOffset={{ width: 1, height: 1 }}
                  shadowOpacity={0.5}
                  shadowRadius={3}
                >
                  {props.stats.comments >= 1000000
                    ? `${(props.stats.comments / 1000000).toFixed(1)}M`
                    : props.stats.comments >= 1000
                      ? `${(props.stats.comments / 1000).toFixed(1)}K`
                      : props.stats.comments}
                </Text>
                <CommentButton
                  postId={props.postId}
                  postRecipientUserId={props.recipient.id}
                  endpoint={props.endpoint}
                  light
                  compact
                />
              </>
            ) : (
              <CommentButton
                postId={props.postId}
                postRecipientUserId={props.recipient.id}
                endpoint={props.endpoint}
                light
                compact
              />
            )}
          </GlassButton>

          {/* Share Button */}
          <GlassButton expanded={false}>
            <ShareButton postId={props.postId} light compact />
          </GlassButton>
        </YStack>

        {/* Bottom Content Overlay */}
        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          paddingHorizontal="$4"
          paddingVertical="$4"
          zIndex={2}
          gap="$2"
        >
          <PostCaption
            caption={props.caption}
            light
            username={props.author.username}
          />
        </YStack>

        {props.stats.comments > 0 && (
          <FloatingComments
            comments={[
              { id: '1', username: 'user1', content: '🔥 This is amazing!' },
              { id: '2', username: 'user2', content: 'Love this! 💫' },
              { id: '3', username: 'user3', content: 'Incredible shot 📸' },
              // We can fetch real comments here
            ]}
          />
        )}
      </View>
    </YStack>
  );
};

PostCard.loading = function PostCardLoading() {
  return (
    <YStack marginVertical="$2">
      <View>
        <Skeleton width="100%" height={600} radius={0} />
        <View position="absolute" top={16} left={16} right={16}>
          <XStack alignItems="center" gap="$3">
            <Skeleton size={44} circular />
            <YStack gap="$2">
              <Skeleton width={120} height={20} />
              <Skeleton width={80} height={14} />
            </YStack>
          </XStack>
        </View>
      </View>
    </YStack>
  );
};

// TODO: This needs cleaning up

interface ImageComponentProps {
  endpoint: "home-feed" | "other-profile" | "self-profile" | "single-post";
  media: Media;
  stats: Stats;
}
const ImageComponent = ({ endpoint, media, stats }: ImageComponentProps) => {
  const { handleLikeDoubleTapped } = useLikePost({
    postId: media.id,
    endpoint,
    userId: media.recipient.id,
    initialHasLiked: stats.hasLiked,
  });
  const { hearts, addHeart } = useHeartAnimations();
  const [isImageLoading, setIsImageLoading] = useState(false);

  const handleDoubleTap = useCallback(
    (x: number, y: number) => {
      addHeart(x, y);
      handleLikeDoubleTapped();
    },
    [addHeart, handleLikeDoubleTapped],
  );

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart((event) => {
      runOnJS(handleDoubleTap)(event.x, event.y);
    });

  return (
    <GestureDetector gesture={doubleTap}>
      <View>
        <Image
          source={{ uri: media.url }}
          recyclingKey={media.id}
          cachePolicy="memory-disk"
          style={{
            width: "100%",
            aspectRatio: media.dimensions.width / media.dimensions.height,
            borderRadius: getToken("$8", "radius") as number,
          }}
          contentFit="cover"
          transition={0}
          onLoadStart={() => {
            requestAnimationFrame(() => {
              setIsImageLoading(true);
            });
          }}
          onLoad={() => {
            requestAnimationFrame(() => {
              setIsImageLoading(false);
            });
          }}
        />
        {isImageLoading && (
          <View
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            justifyContent="center"
            alignItems="center"
            backgroundColor="rgba(0, 0, 0, 0.1)"
          >
            <Circle size={48} borderWidth={2} borderColor="$gray11" />
          </View>
        )}
        {hearts.map((heart) => (
          <GradientHeart
            key={heart.id}
            gradient={heart.gradient}
            position={heart.position}
          />
        ))}
      </View>
    </GestureDetector>
  );
};

interface VideoPlayerProps {
  endpoint: "home-feed" | "other-profile" | "self-profile" | "single-post";
  media: Media;
  stats: Stats;
}

// TODO: This needs cleaning up

const VideoPlayerComponent = ({ endpoint, media, stats }: VideoPlayerProps) => {
  const videoRef = useRef<Video>(null);
  const { isMuted, toggleMute } = useAudio();
  const { muteIcons, addMute } = useMuteAnimations();
  const { hearts, addHeart } = useHeartAnimations();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const { handleLikeDoubleTapped } = useLikePost({
    postId: media.id,
    endpoint,
    userId: media.recipient.id,
    initialHasLiked: stats.hasLiked,
  });

  useFocusEffect(
    useCallback(() => {
      if (media.isViewable) {
        void videoRef.current?.playAsync();
        setIsPlaying(true);
        setIsPaused(false);
      } else {
        void videoRef.current?.pauseAsync();
        setIsPlaying(false);
      }

      return () => {
        void videoRef.current?.pauseAsync();
      };
    }, [media.isViewable]),
  );

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      requestAnimationFrame(() => {
        setIsVideoLoading(false);
      });
    }
  };

  const handleMute = useCallback(() => {
    toggleMute();
    addMute(!isMuted);
    void videoRef.current?.setIsMutedAsync(!isMuted);
  }, [toggleMute, addMute, isMuted]);

  const handleDoubleTap = useCallback(
    (x: number, y: number) => {
      addHeart(x, y);
      handleLikeDoubleTapped();
    },
    [addHeart, handleLikeDoubleTapped],
  );

  const handleHold = useCallback(() => {
    if (isPlaying) {
      void videoRef.current?.pauseAsync();
      setIsPaused(true);
    }
  }, [isPlaying]);

  const handleRelease = useCallback(() => {
    if (isPaused) {
      void videoRef.current?.playAsync();
      setIsPaused(false);
    }
  }, [isPaused]);

  const longPress = Gesture.LongPress()
    .onStart(() => {
      runOnJS(handleHold)();
    })
    .onEnd(() => {
      runOnJS(handleRelease)();
    });

  const singleTap = Gesture.Tap().onStart(() => {
    runOnJS(handleMute)();
  });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart((event) => {
      runOnJS(handleDoubleTap)(event.x, event.y);
    });

  const gestures = Gesture.Exclusive(
    doubleTap,
    Gesture.Race(longPress, singleTap),
  );

  return (
    <GestureDetector gesture={gestures}>
      <View>
        <Video
          ref={videoRef}
          style={{
            width: "100%",
            aspectRatio: media.dimensions.width / media.dimensions.height,
            borderRadius: getToken("$8", "radius") as number,
          }}
          source={{ uri: media.url }}
          resizeMode={ResizeMode.COVER}
          isLooping={true}
          isMuted={isMuted}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onLoadStart={() => {
            requestAnimationFrame(() => {
              setIsVideoLoading(true);
            });
          }}
        />
        {isVideoLoading && (
          <View
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            justifyContent="center"
            alignItems="center"
            backgroundColor="rgba(0, 0, 0, 0.1)"
          >
            <Circle size={48} borderWidth={2} borderColor="$gray11" />
          </View>
        )}
        {muteIcons.map((muteIcon) => (
          <Mute key={muteIcon.id} muted={muteIcon.muted} />
        ))}
        {hearts.map((heart) => (
          <GradientHeart
            key={heart.id}
            gradient={heart.gradient}
            position={heart.position}
          />
        ))}
      </View>
    </GestureDetector>
  );
};

const VideoPlayer = React.memo(VideoPlayerComponent);

// Create a reusable glass button component
const GlassButton = ({
  expanded,
  children,
}: {
  expanded: boolean;
  children: React.ReactNode;
}) => (
  <XStack
    borderRadius={50}
    height={50}
    alignItems="center"
    animation="quick"
    pressStyle={{
      scale: 0.96,
      opacity: 0.8,
    }}
    // Glass effect with darker base
    backgroundColor="rgba(0,0,0,0.35)"
    shadowColor="rgba(0,0,0,0.2)"
    shadowOffset={{ width: 0, height: 2 }}
    shadowRadius={8}
    shadowOpacity={1}
    borderWidth={0.5}
    borderColor="rgba(255,255,255,0.15)"
    // Glass overlay
    style={{
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    }}
  >
    {expanded ? (
      <XStack alignItems="center" gap="$3" paddingLeft="$4" paddingRight="$3">
        {children}
      </XStack>
    ) : (
      <XStack
        width={50}
        height={50}
        alignItems="center"
        justifyContent="center"
      >
        {children}
      </XStack>
    )}
  </XStack>
);

export default PostCard;
