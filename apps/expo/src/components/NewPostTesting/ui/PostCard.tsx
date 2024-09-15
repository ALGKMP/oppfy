import React, { useCallback, useRef, useState } from "react";
import { TouchableOpacity } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "@tamagui/lucide-icons";
import {
  getToken,
  Paragraph,
  SizableText,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import Skeleton from "~/components/Skeletons/Skeleton";
import { TimeAgo } from "~/components/Texts";
import { useAudio } from "~/contexts/AudioContext";
import Avatar from "../../Avatar";
import CardContainer from "../../Containers/CardContainer";
import GradientHeart, { useHeartAnimations } from "../../Icons/GradientHeart";
import Mute, { useMuteAnimations } from "../../Icons/Mute";

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
  type: "image" | "video";
  url: string;
  isViewable: boolean;
  dimensions: MediaDimensions;
}

interface Stats {
  likes: number;
  comments: number;
}

export interface PostData {
  id: string;
  createdAt: Date;
  caption: string;
  self: Self;
  author: Author;
  recipient: Recipient;
  media: Media;
  stats: Stats;
}

interface PostCallbacks {
  onLikePressed: () => void;
  onLikeDoubleTapped: () => void;
  onComment: () => void;
  onShare: () => void;
  onMoreOptions: () => void;
  onAuthorPress: () => void;
  onRecipientPress: () => void;
}

type LoadedPostCardProps = PostData &
  PostCallbacks & { hasLiked: boolean; loading: false };

interface LoadingPostCardProps {
  loading: true;
}

type PostCardProps = LoadingPostCardProps | LoadedPostCardProps;

const PostCard = (props: PostCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const buttonLikeScale = useSharedValue(1);

  const heartButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonLikeScale.value }],
    };
  });

  const handleLikePress = useCallback(() => {
    if (props.loading) return;
    props.onLikePressed();
    buttonLikeScale.value = withSpring(
      1.2,
      {
        damping: 10,
        stiffness: 200,
      },
      () => {
        buttonLikeScale.value = withSpring(1, {
          damping: 10,
          stiffness: 200,
        });
      },
    );
  }, [props, buttonLikeScale]);

  const renderMedia = (media: Media) => {
    if (props.loading) return;

    return media.type === "image" ? (
      <ImageComponent
        media={media}
        onLikeDoubleTapped={props.onLikeDoubleTapped}
      />
    ) : (
      <VideoPlayer
        media={media}
        onLikeDoubleTapped={props.onLikeDoubleTapped}
      />
    );
  };

  const formatTimeAgo = ({ value, unit }: { value: number; unit: string }) => {
    if (value === 0 && unit === "second") return "Just now";
    const pluralS = value !== 1 ? "s" : "";
    return `${value} ${unit}${pluralS} ago`;
  };

  if (props.loading) {
    return (
      <CardContainer paddingVertical={0}>
        <YStack>
          <View marginHorizontal="$-3">
            <Skeleton width="100%" height={600} radius={8} />
            <View position="absolute" bottom={15} left={15}>
              <XStack alignItems="center" gap="$3">
                <Skeleton size={40} circular />
                <YStack gap="$1">
                  <Skeleton width={100} height={16} />
                  <XStack alignItems="center" gap="$2">
                    <Skeleton size={20} circular />
                    <Skeleton width={80} height={12} />
                  </XStack>
                </YStack>
              </XStack>
            </View>
          </View>
        </YStack>
      </CardContainer>
    );
  }

  return (
    <CardContainer paddingTop={0}>
      <YStack gap="$3">
        <View marginHorizontal="$-3">
          <View>
            {renderMedia(props.media)}
            <View position="absolute" bottom={15} left={15}>
              <XStack alignItems="center" gap="$3">
                <TouchableOpacity
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    props.onRecipientPress();
                  }}
                >
                  <Avatar source={props.recipient.profilePicture} size={40} />
                </TouchableOpacity>

                <YStack gap="$1">
                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Light,
                      );
                      props.onRecipientPress();
                    }}
                  >
                    <SizableText fontWeight="bold" lineHeight={0}>
                      {props.recipient.username}
                    </SizableText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Light,
                      );
                      props.onAuthorPress();
                    }}
                  >
                    <XStack alignItems="center" gap="$2">
                      <SizableText size="$2" fontWeight="bold" lineHeight={0}>
                        Opped by{" "}
                        <SizableText fontWeight="bold" color="$primary">
                          {props.author.username}
                        </SizableText>
                      </SizableText>
                    </XStack>
                  </TouchableOpacity>
                </YStack>
              </XStack>
            </View>
            <TouchableOpacity
              style={{ position: "absolute", bottom: 15, right: 15 }}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onMoreOptions();
              }}
            >
              <MoreHorizontal />
            </TouchableOpacity>
          </View>
        </View>

        {/* Under post */}
        <YStack flex={1} paddingHorizontal="$1" gap="$1">
          <XStack gap="$3.5" alignItems="center">
            {/* Like Button */}
            <TouchableOpacity onPress={handleLikePress}>
              <Animated.View style={[heartButtonAnimatedStyle]}>
                <Heart
                  size="$2"
                  padding="$3"
                  color={props.hasLiked ? "red" : "$gray12"}
                  fill="red"
                  fillOpacity={props.hasLiked ? 1 : 0}
                />
              </Animated.View>
            </TouchableOpacity>

            {/* Comment Button */}
            <TouchableOpacity onPress={() => props.onComment()}>
              <MessageCircle size="$2" color="$gray12" />
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity onPress={() => props.onShare()}>
              <Send size={26} color="$gray12" />
            </TouchableOpacity>
          </XStack>

          {/* Likes Count */}
          {props.stats.likes > 0 && (
            <TouchableOpacity>
              <SizableText size="$3" fontWeight="bold">
                {props.stats.likes > 0
                  ? `${props.stats.likes} ${props.stats.likes === 1 ? "like" : "likes"}`
                  : ""}
              </SizableText>
            </TouchableOpacity>
          )}

          {/* Caption */}
          {props.caption && (
            <TouchableOpacity
              disabled={isExpanded || props.caption.length <= 110}
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <Paragraph>
                <Text fontWeight="bold">{props.author.username} </Text>
                {isExpanded ? (
                  props.caption
                ) : (
                  <>
                    {props.caption.slice(0, 110)}
                    {props.caption.length > 110 && (
                      <>
                        ...
                        <Text color="$gray8"> more</Text>
                      </>
                    )}
                  </>
                )}
              </Paragraph>
            </TouchableOpacity>
          )}

          {/* Comments Count */}
          <TouchableOpacity onPress={() => props.onComment()}>
            <SizableText size="$3" color="$gray10">
              {props.stats.comments > 0
                ? `View ${props.stats.comments > 1 ? "all " : ""}${props.stats.comments} ${props.stats.comments === 1 ? "comment" : "comments"}`
                : "Be the first to comment"}
            </SizableText>
          </TouchableOpacity>

          {/* Post Date */}
          <SizableText size="$2" color="$gray10">
            <TimeAgo
              size="$2"
              theme="alt2"
              lineHeight={0}
              date={props.createdAt}
              format={formatTimeAgo}
            />
          </SizableText>
        </YStack>
      </YStack>
    </CardContainer>
  );
};

interface ImageComponentProps {
  media: Media;
  onLikeDoubleTapped: () => void;
}

const ImageComponent = ({ media, onLikeDoubleTapped }: ImageComponentProps) => {
  const { hearts, addHeart } = useHeartAnimations();

  const handleDoubleTap = useCallback(
    (x: number, y: number) => {
      addHeart(x, y);
      onLikeDoubleTapped();
    },
    [addHeart, onLikeDoubleTapped],
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
          style={{
            width: "100%",
            aspectRatio: media.dimensions.width / media.dimensions.height,
            borderRadius: getToken("$8", "radius") as number,
          }}
          contentFit="cover"
        />
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
  media: Media;
  onLikeDoubleTapped: () => void;
}

export const VideoPlayer = ({
  media,
  onLikeDoubleTapped,
}: VideoPlayerProps) => {
  const videoRef = useRef<VideoView>(null);
  const { isMuted, toggleMute } = useAudio();
  const { muteIcons, addMute } = useMuteAnimations();
  const { hearts, addHeart } = useHeartAnimations();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const player = useVideoPlayer(media.url, (player) => {
    player.loop = true;
    player.staysActiveInBackground = false;
    player.muted = isMuted;
    player.play();
    setIsPlayerReady(true);
  });

  const safePlayPause = useCallback(
    (shouldPlay: boolean) => {
      if (!isPlayerReady || !media.isViewable) return;

      if (shouldPlay && !isPlaying) {
        player.play();
        setIsPlaying(true);
      } else if (!shouldPlay && isPlaying) {
        player.pause();
        setIsPlaying(false);
      }
    },
    [isPlayerReady, player, isPlaying, media.isViewable],
  );

  useFocusEffect(
    useCallback(() => {
      if (isPlayerReady && media.isViewable) {
        safePlayPause(true);
      }

      return () => {
        if (isPlayerReady) {
          safePlayPause(false);
        }
      };
    }, [isPlayerReady, safePlayPause, media.isViewable]),
  );

  const handleMute = useCallback(() => {
    toggleMute();
    addMute(!isMuted);
    player.muted = !isMuted;
  }, [toggleMute, addMute, isMuted, player]);

  const handleDoubleTap = useCallback(
    (x: number, y: number) => {
      addHeart(x, y);
      onLikeDoubleTapped();
    },
    [addHeart, onLikeDoubleTapped],
  );

  const singleTap = Gesture.Tap().onStart(() => {
    runOnJS(handleMute)();
  });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart((event) => {
      runOnJS(handleDoubleTap)(event.x, event.y);
    });

  const gestures = Gesture.Exclusive(doubleTap, singleTap);

  return (
    <GestureDetector gesture={gestures}>
      <View>
        <VideoView
          ref={videoRef}
          style={{
            width: "100%",
            aspectRatio: media.dimensions.width / media.dimensions.height,
            borderRadius: getToken("$8", "radius") as number,
          }}
          contentFit="cover"
          player={player}
          nativeControls={false}
        />
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

export default PostCard;
