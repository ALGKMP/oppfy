import React, { useEffect, useState } from "react";
import { DimensionValue, LayoutChangeEvent, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme, View } from "tamagui";

interface BaseSkeletonProps {
  radius?: number;
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

const Skeleton = (props: SkeletonProps) => {
  const theme = useTheme();
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);
  const translateX = useSharedValue(-measuredWidth);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(measuredWidth, {
        duration: 1200,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [measuredWidth]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setMeasuredWidth(width);
  };

  const { radius = 6 } = props;
  const resolvedBorderRadius = props.circular ? 9999 : radius;

  const width = props.circular ? props.size : props.width;
  const height = props.circular ? props.size : props.height;

  return (
    <View
      overflow="hidden"
      backgroundColor={"$gray5"}
      style={{
        width,
        height,
        borderRadius: resolvedBorderRadius,
      }}
      onLayout={handleLayout}
    >
      <Animated.View style={[styles.gradientWrapper, animatedStyle]}>
        <LinearGradient
          colors={[theme.gray5.val, theme.gray3.val, theme.gray5.val]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
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
  gradient: {
    flex: 1,
  },
});

export default Skeleton;
