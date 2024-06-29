import React, { useEffect, useRef, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS } from "react-native-reanimated";
import { useVideoPlayer, VideoView } from "expo-video";
import { Heart } from "@tamagui/lucide-icons";

interface VideoPlayerProps {
  videoSource: string;
  isViewable: boolean;
  isMuted: boolean;
  setIsMuted: (isMuted: boolean) => void;
  animatedHeartImageStyle: StyleProp<ViewStyle>;
}

const VideoPost: React.FC<VideoPlayerProps> = ({
  videoSource,
  isViewable,
  isMuted = false,
  setIsMuted,
  animatedHeartImageStyle,
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

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

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
      <Animated.View
        style={[
          animatedHeartImageStyle,
          { flex: 1, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Heart size={100} color="red" fill="red" />
      </Animated.View>
    </VideoView>
  );
};

export default VideoPost;
