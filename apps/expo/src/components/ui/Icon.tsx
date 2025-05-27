import React from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { StyleSheet, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "tamagui";

export type IconName = keyof typeof Ionicons.glyphMap;

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
  color,
  size = 22,
  style,
  iconStyle,
  onPress,
  disabled,
  blurred,
}: IconProps) => {
  const theme = useTheme();

  const iconElement = (
    <Ionicons
      name={name}
      size={size}
      color={color ?? theme.color.val}
      style={iconStyle}
    />
  );

  return (
    <TouchableOpacity
      style={[styles(size).iconButton, style]}
      onPress={onPress}
      disabled={disabled}
    >
      {blurred ? (
        <BlurView intensity={30} style={styles(size).blurView}>
          {iconElement}
        </BlurView>
      ) : (
        iconElement
      )}
    </TouchableOpacity>
  );
};

const styles = (size: number) =>
  StyleSheet.create({
    iconButton: {
      width: size + 14,
      height: size + 14,
      borderRadius: 16,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
    },
    blurView: {
      width: size + 14,
      height: size + 14,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(64, 64, 64, 0.4)",
    },
  });
