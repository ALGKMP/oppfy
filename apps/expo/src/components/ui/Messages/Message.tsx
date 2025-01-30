import React, { useEffect } from "react";
import type { TextStyle, ViewStyle } from "react-native";
import { Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";

import { Text, View } from "..";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface MessageAnimation {
  isAngry?: boolean;
  isShook?: boolean;
  isSpecial?: boolean;
  delay: number;
  duration: number;
  hapticFeedback?: "light" | "medium" | "heavy";
}

export interface MessageMedia {
  type: "image" | "video" | "gif";
  url: string;
  aspectRatio?: number;
  previewUrl?: string;
}

export interface MessageAuthor {
  name: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface MessageProps {
  id: string | number;
  text: string;
  type: "system" | "friend" | "you" | "preview" | "announcement";
  author?: MessageAuthor;
  media?: MessageMedia;
  animation?: Partial<MessageAnimation>;
  style?: {
    bubble?: ViewStyle;
    text?: TextStyle;
    container?: ViewStyle;
  };
  theme?: {
    colors?: {
      primary?: string;
      secondary?: string;
      background?: string;
      text?: string;
    };
    borderRadius?: number;
  };
}

const DEFAULT_ANIMATION: MessageAnimation = {
  delay: 0,
  duration: 500,
  hapticFeedback: "light",
};

const ANIMATION_CONFIG = {
  normal: { mass: 0.3, stiffness: 300, damping: 20 },
  angry: { mass: 0.3, stiffness: 400, damping: 12 },
  special: { mass: 0.3, stiffness: 400 },
} as const;

export const Message: React.FC<MessageProps> = ({
  text,
  type,
  author,
  media,
  animation = {},
  style = {},
  theme = {},
}) => {
  const mergedAnimation = { ...DEFAULT_ANIMATION, ...animation };
  const isSystem = type === "system" || type === "announcement";
  const isFriend = type === "friend";
  const isPreview = type === "preview";

  // Animation values
  const scale = useSharedValue(0.8);
  const slideY = useSharedValue(20);
  const opacity = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    opacity.value = withTiming(1, { duration: mergedAnimation.duration / 2 });
    slideY.value = withSpring(
      0,
      mergedAnimation.isAngry
        ? ANIMATION_CONFIG.angry
        : ANIMATION_CONFIG.normal,
    );

    // Scale animation
    if (mergedAnimation.isSpecial) {
      scale.value = withSequence(
        withSpring(1.2, ANIMATION_CONFIG.special),
        withSpring(1, ANIMATION_CONFIG.special),
      );
    } else if (mergedAnimation.isShook) {
      scale.value = withSequence(
        withSpring(1.1, ANIMATION_CONFIG.special),
        withSpring(1, ANIMATION_CONFIG.special),
      );
    } else {
      scale.value = withSpring(1, ANIMATION_CONFIG.normal);
    }

    // Shake animation
    if (mergedAnimation.isAngry) {
      shake.value = withSequence(
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }

    // Haptic feedback
    if (mergedAnimation.hapticFeedback) {
      void Haptics.impactAsync(
        mergedAnimation.hapticFeedback === "heavy"
          ? Haptics.ImpactFeedbackStyle.Heavy
          : mergedAnimation.hapticFeedback === "medium"
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light,
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: slideY.value },
      { translateX: shake.value },
    ],
    opacity: opacity.value,
  }));

  if (isPreview && media) {
    return (
      <Animated.View
        style={[
          animatedStyle,
          {
            alignSelf: "center",
            width: SCREEN_WIDTH * 0.85,
            marginVertical: 12,
            borderRadius: theme.borderRadius ?? 16,
            overflow: "hidden",
            backgroundColor: theme.colors?.background ?? "#1A1A1A",
          },
          style.container,
        ]}
      >
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: media.url }}
            style={{
              width: "100%",
              height: media.aspectRatio
                ? SCREEN_WIDTH * 0.85 * media.aspectRatio
                : SCREEN_WIDTH * 0.6,
            }}
            contentFit="cover"
          />
          {author && (
            <LinearGradient
              colors={["rgba(0,0,0,0.9)", "transparent"]}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 80,
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
            >
              <Image
                source={
                  author.avatar ? { uri: author.avatar } : DefaultProfilePicture
                }
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  marginRight: 12,
                  borderWidth: 2,
                  borderColor: theme.colors?.primary ?? "#007AFF",
                }}
              />
              <Text
                color={theme.colors?.text ?? "white"}
                fontSize={18}
                fontWeight="bold"
              >
                {text.split("\n")[0]}
              </Text>
            </LinearGradient>
          )}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              backgroundColor: "rgba(0,0,0,0.8)",
            }}
          >
            <Text
              color={theme.colors?.primary ?? "#007AFF"}
              fontSize={16}
              fontWeight="bold"
            >
              {text.split("\n")[1]}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          alignSelf: isFriend
            ? "flex-start"
            : type === "you"
              ? "flex-end"
              : "center",
          maxWidth: isSystem ? "90%" : "70%",
          marginVertical: 4,
          marginHorizontal: 12,
        },
        style.container,
      ]}
    >
      <View
        style={[
          {
            backgroundColor: isSystem
              ? "transparent"
              : isFriend
                ? (theme.colors?.secondary ?? "#1A1A1A")
                : (theme.colors?.primary ?? "#007AFF"),
            padding: 16,
            paddingVertical: isSystem ? 12 : 16,
            borderRadius: theme.borderRadius ?? 20,
            borderTopLeftRadius: isFriend ? 6 : (theme.borderRadius ?? 20),
            borderTopRightRadius:
              type === "you" ? 6 : (theme.borderRadius ?? 20),
          },
          style.bubble,
        ]}
      >
        <Text
          style={[
            {
              color: theme.colors?.text ?? "#FFFFFF",
              fontSize: isSystem ? 24 : 16,
              textAlign: isSystem ? "center" : "left",
              fontWeight: isSystem ? "900" : "600",
              lineHeight: 24,
            },
            style.text,
          ]}
        >
          {text}
        </Text>
      </View>
    </Animated.View>
  );
};
