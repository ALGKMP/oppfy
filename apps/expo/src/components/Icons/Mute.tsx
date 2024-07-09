import { useCallback, useEffect, useState } from "react";
import Animated, {
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Volume2, VolumeX } from "@tamagui/lucide-icons";
import { Avatar, View } from "tamagui";

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
    <Animated.View style={muteAnimatedStyle}>
      <View flex={1} justifyContent="center" alignItems="center">
        <Avatar circular size="$5" backgroundColor="$gray7">
          {muted ? <VolumeX size="$2" /> : <Volume2 size="$2" />}
        </Avatar>
      </View>
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
