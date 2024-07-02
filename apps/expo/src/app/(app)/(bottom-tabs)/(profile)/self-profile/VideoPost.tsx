import React, { useEffect, useRef, useState } from "react";
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
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = isMuted;
    player.staysActiveInBackground = false;
  });

  useEffect(() => {
    if (isViewable) {
      player.play();
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
    }

    return () => {
      player.pause();
      setIsPlaying(false);
    };
  }, [isViewable, player]);

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  useFocusEffect(
    React.useCallback(() => {
      // When the screen comes into focus, play the video if it's viewable
      if (isViewable) {
        player.play();
        setIsPlaying(true);
      }

      // When the screen loses focus, pause the video
      return () => {
        player.pause();
        setIsPlaying(false);
      };
    }, [player, isViewable]),
  );

  // const togglePlay = () => {
  //   setIsPlaying(!isPlaying);
  //   if (isPlaying) {
  //     player.pause();
  //   } else {
  //     player.play();
  //   }
  // };

  // useEffect(() => {
  //   return () => {
  //   }
  // }, [])

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
