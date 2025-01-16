import React from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { StyleSheet, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

type IconName = keyof typeof Ionicons.glyphMap;

interface IconProps {
  name: IconName;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
  disabled?: boolean;
  blurred?: boolean;
}

export const Icon = ({
  name,
  color = "white",
  size = 22,
  style,
  iconStyle,
  onPress,
  disabled,
  blurred,
}: IconProps) => {
  const iconElement = (
    <Ionicons name={name} size={size} color={color} style={iconStyle} />
  );

  if (!onPress) {
    return iconElement;
  }

  return (
    <TouchableOpacity
      style={[styles.iconButton, style]}
      onPress={onPress}
      disabled={disabled}
    >
      {blurred ? (
        <BlurView intensity={30} style={styles.blurView}>
          {iconElement}
        </BlurView>
      ) : (
        iconElement
      )}
    </TouchableOpacity>
  );
};

export type { IconName };
const styles = StyleSheet.create({
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  blurView: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(64, 64, 64, 0.4)",
  },
});
