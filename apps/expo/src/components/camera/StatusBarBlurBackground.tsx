import React from "react";
import { Platform, StyleSheet } from "react-native";
import { initialWindowMetrics } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import type { BlurViewProps } from "expo-blur";

const StatusBarBlurBackground = ({
  style,
  ...props
}: BlurViewProps): React.ReactElement | null => {
  if (Platform.OS !== "ios") return null;

  return (
    <BlurView
      style={[styles.statusBarBackground, style]}
      tint="light"
      intensity={25}
      {...props}
    />
  );
};

export default React.memo(StatusBarBlurBackground);

const styles = StyleSheet.create({
  statusBarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: initialWindowMetrics?.insets.top,
  },
});
