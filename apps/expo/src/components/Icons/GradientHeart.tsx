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
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

interface GradientHeartProps {
  gradient: [number, number, number, number];
  position: { x: number; y: number };
}

const ANIMATION_DURATION = 400;

const GradientHeart = ({ gradient, position }: GradientHeartProps) => {
  const [x1, y1, x2, y2] = gradient;
  const { x, y } = position;
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(
      1,
      {
        duration: ANIMATION_DURATION,
        dampingRatio: 0.5,
        stiffness: 50,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 2,
        reduceMotion: ReduceMotion.System,
      },
      () => {
        scale.value = withDelay(150, withTiming(0, { duration: 250 }));
      },
    );
  }, [scale]);

  const heartImageAnimatedStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      left: x,
      top: y,
      transform: [
        { translateX: -40 },
        { translateY: -40 },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.View style={heartImageAnimatedStyle}>
      <Svg height="100" width="100" viewBox="0 0 24 24">
        <Defs>
          <LinearGradient id="grad" x1={x1} y1={y1} x2={x2} y2={y2}>
            {/* TODO: Find better colors */}
            <Stop offset="0" stopColor="#F214FF" stopOpacity="1" />
            <Stop offset="1" stopColor="#ff0000" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="url(#grad)"
        />
      </Svg>
    </Animated.View>
  );
};

interface HeartAnimation {
  id: number;
  position: { x: number; y: number };
  gradient: [number, number, number, number];
}

export const useHeartAnimations = () => {
  const [hearts, setHearts] = useState<HeartAnimation[]>([]);

  const getRandomGradient = useCallback((): [
    number,
    number,
    number,
    number,
  ] => {
    const gradientDirections: [number, number, number, number][] = [
      [1, 1, 0, 0],
      [0, 0, 0, 1],
      [0, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 1, 0],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [0, 1, 1, 0],
    ];

    return (
      gradientDirections[
        Math.floor(Math.random() * gradientDirections.length)
      ] ?? [0, 0, 1, 1]
    );
  }, []);

  const addHeart = useCallback(
    (x: number, y: number) => {
      const newHeart: HeartAnimation = {
        id: Date.now(),
        position: { x, y },
        gradient: getRandomGradient(),
      };

      setHearts((prevHearts) => [...prevHearts, newHeart]);

      setTimeout(() => {
        setHearts((prevHearts) =>
          prevHearts.filter((heart) => heart.id !== newHeart.id),
        );
      }, ANIMATION_DURATION * 3);
    },
    [getRandomGradient],
  );

  return { hearts, addHeart };
};

export default GradientHeart;
