import React, { useEffect, useRef, useState, useCallback } from "react";
import { useVideoPlayer, VideoView } from "expo-video";
import { useFocusEffect } from "@react-navigation/native";

interface VideoPlayerProps {
  videoSource: string;
  isViewable: boolean;
  isMuted: boolean;
  setIsMuted: (isMuted: boolean) => void;
  children: React.ReactNode;
}

const VideoPost: React.FC<VideoPlayerProps> = ({
  videoSource,
  isViewable,
  isMuted = false,
  setIsMuted,
  children,
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = isMuted;
    player.staysActiveInBackground = false;
    setIsPlayerReady(true);
  });

  const safePlayPause = useCallback((shouldPlay: boolean) => {
    if (!isPlayerReady) return;

    try {
      if (shouldPlay && !isPlaying) {
        player.play();
        setIsPlaying(true);
      } else if (!shouldPlay && isPlaying) {
        player.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Error in safePlayPause:", error);
    }
  }, [isPlayerReady, player, isPlaying]);

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  useFocusEffect(
    useCallback(() => {
      if (isPlayerReady) {
        safePlayPause(isViewable);
      }

      return () => {
        if (isPlayerReady) {
          safePlayPause(false);
        }
      };
    }, [isPlayerReady, isViewable, safePlayPause])
  );

  return (
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
    >
      {children}
    </VideoView>
  );
};

export default VideoPost;
