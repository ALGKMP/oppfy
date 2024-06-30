import React, { useEffect, useRef, useState } from "react";
import { useVideoPlayer, VideoView } from "expo-video";

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
  }, [isMuted]);

  // const togglePlay = () => {
  //   setIsPlaying(!isPlaying);
  //   if (isPlaying) {
  //     player.pause();
  //   } else {
  //     player.play();
  //   }
  // };

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
