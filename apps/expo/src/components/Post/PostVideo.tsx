import React, { useCallback, useEffect, useRef, useState } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { ResizeMode, Video } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";
import { useFocusEffect } from "expo-router";
import { getToken } from "tamagui";

import { Circle, View } from "~/components/ui";
import { useAudio } from "~/contexts/AudioContext";
import type { RouterOutputs } from "~/utils/api";
import GradientHeart, { useHeartAnimations } from "../Icons/GradientHeart";
import Mute, { useMuteAnimations } from "../Icons/Mute";
import { useLike } from "./hooks/useLike";

type Post = RouterOutputs["post"]["paginatePosts"]["items"][number];

interface PostVideoProps {
  post: Post["post"];
  stats: Post["postStats"];
  isLiked: boolean;
  isViewable: boolean;
}

export const PostVideo = (props: PostVideoProps) => {
  const { likePost } = useLike({
    postId: props.post.id,
  });

  const videoRef = useRef<Video>(null);

  const { isMuted, toggleMute } = useAudio();
  const { muteIcons, addMute } = useMuteAnimations();
  const { hearts, addHeart } = useHeartAnimations();

  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (props.isViewable) {
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
    }, [props.isViewable]),
  );

  // Cleanup loading state when component unmounts
  useEffect(() => {
    return () => {
      setIsVideoLoading(false);
    };
  }, []);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsVideoLoading(false);
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
      if (!props.isLiked) void likePost();
    },
    [addHeart, props.isLiked, likePost],
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
        <>
          <Video
            ref={videoRef}
            style={{
              width: "100%",
              aspectRatio: props.post.width / props.post.height,
              borderRadius: getToken("$8", "radius") as number,
            }}
            source={{ uri: props.post.assetUrl }}
            resizeMode={ResizeMode.COVER}
            isLooping={true}
            isMuted={isMuted}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onLoadStart={() => setIsVideoLoading(true)}
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
        </>

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
