import React, { useMemo } from "react";
import type { DimensionValue } from "react-native";
import { StyleSheet } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { View } from "tamagui";
import { LinearGradient } from "tamagui/linear-gradient";

interface BaseSkeletonProps {
  radius?: number;
  shimmerColor?: string;
  backgroundColor?: string;
  shimmerDuration?: number;
  testID?: string;
}

interface RectangularSkeletonProps extends BaseSkeletonProps {
  circular?: false;
  width: DimensionValue;
  height: DimensionValue;
}

interface CircularSkeletonProps extends BaseSkeletonProps {
  circular: true;
  size: DimensionValue;
}

type SkeletonProps = RectangularSkeletonProps | CircularSkeletonProps;

const Skeleton = ({
  radius = 6,
  shimmerColor = "$gray3",
  backgroundColor = "$gray5",
  shimmerDuration = 1000,
  ...props
}: SkeletonProps) => {
  const resolvedBorderRadius = props.circular ? 9999 : radius;
  const width = props.circular ? props.size : props.width;
  const height = props.circular ? props.size : props.height;

  const shimmer = useSharedValue(0);

  React.useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: shimmerDuration }),
        withTiming(0, { duration: shimmerDuration }),
      ),
      -1,
      false,
    );
  }, [shimmer, shimmerDuration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-100, 100]) },
    ],
  }));

  const memoizedGradientColors = useMemo(
    () => [backgroundColor, shimmerColor, backgroundColor],
    [backgroundColor, shimmerColor],
  );

  return (
    <View
      overflow="hidden"
      backgroundColor={backgroundColor}
      style={{
        width,
        height,
        borderRadius: resolvedBorderRadius,
      }}
    >
      <Animated.View style={[styles.gradientWrapper, animatedStyle]}>
        <LinearGradient
          flex={1}
          colors={memoizedGradientColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientWrapper: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
});

export default React.memo(Skeleton);
