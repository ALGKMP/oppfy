import React, { useEffect, useRef, useState } from "react";
import { TouchableOpacity } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { useVideoPlayer, VideoView } from "expo-video";
import { Heart } from "@tamagui/lucide-icons";
import { View } from "tamagui";

interface VideoPlayerProps {
  videoSource: string;
  isViewable: boolean;
  animatedHeartImageStyle: StyleProp<ViewStyle>;
}

const VideoPost: React.FC<VideoPlayerProps> = ({
  videoSource,
  isViewable,
  animatedHeartImageStyle,
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.staysActiveInBackground = false;
  });

  useEffect(() => {
    if (isViewable) {
      console.log(`Video is playing`);
      player.play();
      setIsPlaying(true);
    } else {
      console.log(`Video is paused`);
      player.pause();
      setIsPlaying(false);
    }

    return () => {
      player.pause();
      setIsPlaying(false);
    };
  }, [isViewable, player]);

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
