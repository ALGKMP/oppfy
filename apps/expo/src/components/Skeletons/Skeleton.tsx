import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "tamagui";

interface SkeletonProps {
  width: number;
  height: number;
  borderRadius?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius = 4,
}) => {
  const theme = useTheme();

  // Shared value for animation
  const translateX = useSharedValue(-width);

  // Animated style for shimmer effect
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Animate the shimmer
  React.useEffect(() => {
    translateX.value = withRepeat(
      withTiming(width, {
        duration: 1200,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [width]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, overflow: "hidden" },
        styles.container,
      ]}
    >
      <Animated.View style={[styles.gradientWrapper, animatedStyle]}>
        <LinearGradient
          colors={[theme.gray5.val, theme.gray3.val, theme.gray5.val]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#2e2e2e",
    marginVertical: 4,
  } as ViewStyle,
  gradientWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
});

export default Skeleton;
