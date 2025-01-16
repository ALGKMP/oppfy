import React, { useCallback, useRef, useState } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { ResizeMode, Video } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";
import { getToken } from "tamagui";
import { useFocusEffect } from "expo-router";

import { Circle, View } from "~/components/ui";
import { useAudio } from "~/contexts/AudioContext";
import { useLikePost } from "~/hooks/post/useLikePost";
import GradientHeart, { useHeartAnimations } from "../Icons/GradientHeart";
import Mute, { useMuteAnimations } from "../Icons/Mute";
import type { PostMediaProps } from "./types";

export const PostVideo = ({ endpoint, media, stats }: PostMediaProps) => {
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

  const gestures = Gesture.Exclusive(doubleTap, Gesture.Race(longPress, singleTap));

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