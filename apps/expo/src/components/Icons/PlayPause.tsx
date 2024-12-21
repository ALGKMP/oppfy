import { useCallback, useEffect, useState } from "react";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Pause, Play } from "@tamagui/lucide-icons";
import { Avatar } from "tamagui";

const ANIMATION_DURATION = 400;
const ANIMATION_END_DELAY = 150;
const ANIMATION_END_DURATION = 250;

const PlayPause = ({ isPlaying }: { isPlaying: boolean }) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(
      1,
      {
        duration: ANIMATION_DURATION,
        stiffness: 500,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 2,
        reduceMotion: ReduceMotion.System,
      },
      () => {
        scale.value = withDelay(
          ANIMATION_END_DELAY,
          withTiming(0, { duration: ANIMATION_END_DURATION }),
        );
      },
    );
  }, [scale]);

  const playPauseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: scale.value,
    };
  });

  return (
    <Animated.View
      style={[
        playPauseAnimatedStyle,
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
        },
      ]}
    >
      <Avatar circular size="$5" backgroundColor="$gray7" flex={1}>
        {isPlaying ? <Pause size="$2" /> : <Play size="$2" />}
      </Avatar>
    </Animated.View>
  );
};

interface PlayPauseAnimation {
  id: number;
  isPlaying: boolean;
}

export const usePlayPauseAnimations = () => {
  const [playPauseIcons, setPlayPauseIcons] = useState<PlayPauseAnimation[]>(
    [],
  );

  const addPlayPause = useCallback((playing: boolean) => {
    const newPlayPause = {
      id: Date.now(),
      isPlaying: playing,
    };
    setPlayPauseIcons((prevIcons) => [...prevIcons, newPlayPause]);

    setTimeout(
      () => {
        setPlayPauseIcons((prevIcons) =>
          prevIcons.filter((icon) => icon.id !== newPlayPause.id),
        );
      },
      ANIMATION_DURATION + ANIMATION_END_DELAY + ANIMATION_END_DURATION,
    );
  }, []);

  return { playPauseIcons, addPlayPause };
};

export default PlayPause;
