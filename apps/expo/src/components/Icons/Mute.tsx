import { useCallback, useEffect, useState } from "react";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Volume2, VolumeX } from "@tamagui/lucide-icons";
import { Avatar } from "tamagui";

const ANIMATION_DURATION = 400;
const ANIMATION_END_DELAY = 150;
const ANIMATION_END_DURATION = 250;

const Mute = ({ muted }: { muted: boolean }) => {
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

  const muteAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: scale.value,
    };
  });

  return (
    <Animated.View
      style={[
        muteAnimatedStyle,
        {
          position: "absolute",
          top: "50%", // Temporary because the animation shifts if the timing isn't perfect when using flex
          left: "45%",
          // transform: [{ translateX: -20 }, { translateY: -20 }],
        },
      ]}
    >
      <Avatar circular size="$5" backgroundColor="$gray7" flex={1}>
        {muted ? <VolumeX size="$2" /> : <Volume2 size="$2" />}
      </Avatar>
    </Animated.View>
  );
};

interface MuteAnimation {
  id: number;
  muted: boolean;
}

export const useMuteAnimations = () => {
  const [muteIcons, setMuteIcons] = useState<MuteAnimation[]>([]);

  const addMute = useCallback((mute: boolean) => {
    const newMute = {
      id: Date.now(),
      muted: mute,
    };
    setMuteIcons((prevMutes) => [...prevMutes, newMute]);

    setTimeout(
      () => {
        setMuteIcons((prevMutes) =>
          prevMutes.filter((mute) => mute.id !== newMute.id),
        );
      },
      ANIMATION_DURATION + ANIMATION_END_DELAY + ANIMATION_END_DURATION,
    );
  }, []);

  return { muteIcons, addMute };
};

export default Mute;
