import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);

interface Point {
  x: number;
  y: number;
}

interface FocusAnimation {
  id: number;
  point: Point;
}

interface FocusIconProps {
  x: number;
  y: number;
  onAnimationComplete: () => void;
}

const ANIMATION_DURATION = 300;
const ANIMATION_DELAY = 300;
const ICON_SIZE = 80;
const STROKE_WIDTH = 2;

const FocusIcon: React.FC<FocusIconProps> = ({ x, y, onAnimationComplete }) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withSequence(
      withTiming(1, { duration: ANIMATION_DURATION }),
      withDelay(
        ANIMATION_DELAY,
        withTiming(0, { duration: ANIMATION_DURATION }, (finished) => {
          if (finished) {
            runOnJS(onAnimationComplete)();
          }
        }),
      ),
    );
  }, [progress, onAnimationComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: x - ICON_SIZE / 2 },
      { translateY: y - ICON_SIZE / 2 },
      { scale: 0.8 + 0.2 * progress.value },
    ],
  }));

  const animatedProps = useAnimatedProps(() => ({
    r: (ICON_SIZE / 2 - STROKE_WIDTH) * progress.value,
  }));

  return (
    <Reanimated.View style={[styles.container, animatedStyle]}>
      <Svg height={ICON_SIZE} width={ICON_SIZE}>
        <Circle
          cx={ICON_SIZE / 2}
          cy={ICON_SIZE / 2}
          r={ICON_SIZE / 2 - STROKE_WIDTH / 2}
          stroke="white"
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
        />
        <AnimatedCircle
          cx={ICON_SIZE / 2}
          cy={ICON_SIZE / 2}
          fill="rgba(255, 255, 255, 0.5)"
          animatedProps={animatedProps}
        />
      </Svg>
    </Reanimated.View>
  );
};

export const useFocusAnimations = () => {
  const [animations, setAnimations] = React.useState<FocusAnimation[]>([]);

  const addAnimation = useCallback((point: Point) => {
    const id = Date.now();
    setAnimations((prev) => [...prev, { id, point }]);
  }, []);

  const removeAnimation = useCallback((id: number) => {
    setAnimations((prev) => prev.filter((anim) => anim.id !== id));
  }, []);

  return { animations, addAnimation, removeAnimation };
};

export const FocusOverlay: React.FC = () => {
  const { animations, addAnimation, removeAnimation } = useFocusAnimations();

  const gesture = Gesture.Tap().onStart((event) => {
    runOnJS(addAnimation)({ x: event.x, y: event.y });
  });

  return (
    <GestureDetector gesture={gesture}>
      <Reanimated.View style={StyleSheet.absoluteFill}>
        {animations.map(({ id, point }) => (
          <FocusIcon
            key={id}
            x={point.x}
            y={point.y}
            onAnimationComplete={() => removeAnimation(id)}
          />
        ))}
      </Reanimated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    height: ICON_SIZE,
    width: ICON_SIZE,
  },
});

export default FocusOverlay;
