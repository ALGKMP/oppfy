import React, { useCallback, useRef, useState } from "react";
import { TouchableOpacity } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { ResizeMode, Video } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { MoreHorizontal } from "@tamagui/lucide-icons";
import { Circle, getToken, SizableText, View, XStack, YStack } from "tamagui";

import Skeleton from "~/components/Skeletons/Skeleton";
import { Paragraph, Text } from "~/components/ui";
import { useAudio } from "~/contexts/AudioContext";
import useRouteProfile from "~/hooks/useRouteProfile";
import Avatar from "../../Avatar";
import CardContainer from "../../Containers/CardContainer";
import GradientHeart, { useHeartAnimations } from "../../Icons/GradientHeart";
import Mute, { useMuteAnimations } from "../../Icons/Mute";
import CommentButton from "../CommentButton";
import CommentsCount from "../CommentsCount";
import { useLikePost } from "../hooks/useLikePost";
import LikeButton from "../LikeButton";
import PostCaption from "../PostCaption";
import PostDate from "../PostDate";
import ShareButton from "../ShareButton";

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

interface PostCallbacks {
  onLikeDoubleTapped: () => void;
  onMoreOptions: () => void;
}

type LoadedPostCardProps = PostData & PostCallbacks;

type PostCardProps = LoadedPostCardProps;

const PostCard = (props: PostCardProps) => {
  const { routeProfile } = useRouteProfile();

  // TODO: Do not delete this yet
  // if (props.loading) {
  //   return (
  //     <CardContainer paddingVertical={0}>
  //       <YStack>
  //         <View marginHorizontal="$-3">
  //           <Skeleton width="100%" height={600} radius={8} />
  //           <View position="absolute" bottom={15} left={15}>
  //             <XStack alignItems="center" gap="$3">
  //               <Skeleton size={40} circular />
  //               <YStack gap="$1">
  //                 <Skeleton width={100} height={16} />
  //                 <XStack alignItems="center" gap="$2">
  //                   <Skeleton size={20} circular />
  //                   <Skeleton width={80} height={12} />
  //                 </XStack>
  //               </YStack>
  //             </XStack>
  //           </View>
  //         </View>
  //       </YStack>
  //     </CardContainer>
  //   );
  // }

  return (
    <CardContainer paddingTop={0}>
      <YStack gap="$3">
        <View marginHorizontal="$-3">
          <View>
            {props.media.type === "image" ? (
              <ImageComponent
                media={props.media}
              />
            ) : (
              <VideoPlayer
                media={props.media}
              />
            )}
            <View position="absolute" bottom={15} left={15}>
              <XStack alignItems="center" gap="$3">
                <TouchableOpacity
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    routeProfile({
                      userId: props.recipient.id,
                      username: props.recipient.username,
                    });
                  }}
                >
                  <Avatar source={props.recipient.profilePicture} size={50} />
                </TouchableOpacity>

                <YStack gap="$1">
                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Light,
                      );
                      routeProfile({
                        userId: props.recipient.id,
                        username: props.recipient.username,
                      });
                    }}
                  >
                    <SizableText size="$5" fontWeight="bold" lineHeight={0}>
                      {props.recipient.username}
                    </SizableText>
                  </TouchableOpacity>
                </YStack>
              </XStack>
            </View>
            <TouchableOpacity
              hitSlop={20}
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
            <LikeButton postId={props.postId} endpoint="home-feed" />

            {/* Comment Button */}
            <CommentButton
              postId={props.postId}
              postRecipientUserId={props.recipient.id}
              endpoint="home-feed"
            />
            {/* Share Button */}
            <ShareButton postId={props.postId} />
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

          {/* Opped by */}
          <TouchableOpacity
            onPress={() => {
              routeProfile({
                userId: props.author.id,
                username: props.author.username,
              });
            }}
          >
            <Paragraph>
              <Text fontWeight="bold">
                opped by{" "}
                <Text fontWeight="bold" color="$primary">
                  {props.author.username}
                </Text>
              </Text>
            </Paragraph>
          </TouchableOpacity>

          {/* Caption */}
          <PostCaption caption={props.caption} />

          {/* Comments Count */}
          <CommentsCount
            commentsCount={props.stats.comments}
            postId={props.postId}
            endpoint="home-feed"
            postRecipientUserId={props.recipient.id}
          />

          {/* Post Date */}
          <PostDate createdAt={props.createdAt} />
        </YStack>
      </YStack>
    </CardContainer>
  );
};

interface ImageComponentProps {
  media: Media;
}
const ImageComponent = ({ media }: ImageComponentProps) => {
  const { handleLikeDoubleTapped } = useLikePost({
    postId: media.id,
    endpoint: "home-feed",
    userId: media.recipient.id,
  });
  const { hearts, addHeart } = useHeartAnimations();
  const [isImageLoading, setIsImageLoading] = useState(true);
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
          recyclingKey={media.url}
          style={{
            width: "100%",
            aspectRatio: media.dimensions.width / media.dimensions.height,
            borderRadius: getToken("$8", "radius") as number,
          }}
          contentFit="cover"
          onLoadStart={() => setIsImageLoading(true)}
          onLoadEnd={() => setIsImageLoading(false)}
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
  media: Media;
}

const VideoPlayerComponent = ({ media }: VideoPlayerProps) => {
  const videoRef = useRef<Video>(null);
  const { isMuted, toggleMute } = useAudio();
  const { muteIcons, addMute } = useMuteAnimations();
  const { hearts, addHeart } = useHeartAnimations();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { handleLikeDoubleTapped } = useLikePost({
    postId: media.id,
    endpoint: "home-feed",
    userId: media.recipient.id,
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
      setIsLoading(false);
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
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
        {isLoading && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0, 0, 0, 0.1)",
            }}
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

export default PostCard;
