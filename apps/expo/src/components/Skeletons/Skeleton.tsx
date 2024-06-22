import React, { useEffect, useState } from "react";
import {
  DimensionValue,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
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
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  circular?: boolean;
}

const Skeleton = ({
  width,
  height,
  borderRadius = 6,
  circular = false,
}: SkeletonProps) => {
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

  const resolvedBorderRadius = circular ? 9999 : borderRadius;

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius: resolvedBorderRadius,
        },
      ]}
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
  container: {
    backgroundColor: "#2e2e2e",
    overflow: "hidden",
  },
  gradientWrapper: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  gradient: {
    flex: 1,
  },
});

export default Skeleton;
