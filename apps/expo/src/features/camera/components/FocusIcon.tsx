import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import Reanimated, {
  Extrapolate,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedSvg = Reanimated.createAnimatedComponent(Svg);
const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);

interface FocusIconProps {
  x: number;
  y: number;
}

const SIZE = 80;
const STROKE_WIDTH = 2;
const ANIMATION_DURATION = 300;

const FocusIcon: React.FC<FocusIconProps> = ({ x, y }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSequence(
      withTiming(1, { duration: ANIMATION_DURATION }),
      withDelay(
        ANIMATION_DURATION,
        withTiming(0, { duration: ANIMATION_DURATION }),
      ),
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        scale: interpolate(progress.value, [0, 1], [0.8, 1], Extrapolate.CLAMP),
      },
    ],
  }));

  const animatedCircleProps = useAnimatedProps(() => ({
    r: interpolate(
      progress.value,
      [0, 1],
      [0, SIZE / 2 - STROKE_WIDTH],
      Extrapolate.CLAMP,
    ),
  }));

  return (
    <Reanimated.View
      style={[
        styles.container,
        { left: x - SIZE / 2, top: y - SIZE / 2 },
        animatedStyle,
      ]}
    >
      <AnimatedSvg height={SIZE} width={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={SIZE / 2 - STROKE_WIDTH / 2}
          stroke="white"
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          fill="rgba(255, 255, 255, 0.5)"
          animatedProps={animatedCircleProps}
        />
      </AnimatedSvg>
    </Reanimated.View>
  );
};

interface Animation {
  id: number;
  point: { x: number; y: number };
}

export const useFocusAnimations = () => {
  const [animations, setAnimations] = React.useState<Animation[]>([]);
  const animationsRef = useRef<Animation[]>([]);

  const addAnimation = useCallback((point: { x: number; y: number }) => {
    const id = Date.now();
    const newAnimation = { id, point };
    animationsRef.current = [...animationsRef.current, newAnimation];
    setAnimations(animationsRef.current);

    setTimeout(() => {
      animationsRef.current = animationsRef.current.filter(
        (anim) => anim.id !== id,
      );
      setAnimations(animationsRef.current);
    }, ANIMATION_DURATION * 3);
  }, []);

  return { animations, addAnimation };
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    height: SIZE,
    width: SIZE,
  },
});

export default FocusIcon;
