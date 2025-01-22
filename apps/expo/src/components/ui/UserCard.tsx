import type { ComponentProps } from "react";
import React, { useCallback, useState } from "react";
import { TouchableOpacity, useWindowDimensions } from "react-native";
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import {
  Check,
  ChevronRight,
  Heart,
  Plus,
  Sparkles,
  UserPlus,
} from "@tamagui/lucide-icons";
import { getTokens } from "tamagui";

import { Button } from "./Buttons";
import { Circle } from "./Shapes";
import { XStack, YStack } from "./Stacks";
import { Text } from "./Texts";
import { View } from "./Views";

const AnimatedYStack = Animated.createAnimatedComponent(YStack);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

type CardSize = "small" | "medium" | "large";
type CardStyle = "minimal" | "gradient" | "glass";

export interface UserCardProps {
  userId: string;
  username: string;
  profilePictureUrl: string | null;
  bio?: string;
  stats?: {
    followers?: number;
    following?: number;
    posts?: number;
  };
  width?: number;
  size?: CardSize;
  style?: CardStyle;
  onPress?: () => void;
  actionButton?: {
    label: string;
    onPress: () => void;
    variant?: ComponentProps<typeof Button>["variant"];
    icon?: "follow" | "add" | "heart" | "check";
  };
  index?: number;
  isVerified?: boolean;
}

export const UserCard = ({
  userId,
  username,
  profilePictureUrl,
  bio,
  stats,
  width: propWidth = 100,
  size = "medium",
  style = "gradient",
  onPress,
  actionButton,
  index = 0,
  isVerified,
}: UserCardProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const [isPressed, setIsPressed] = useState(false);

  // Dynamic sizing based on card size variant
  const width =
    propWidth ??
    {
      small: windowWidth * 0.35,
      medium: windowWidth * 0.45,
      large: windowWidth * 0.9,
    }[size];

  const aspectRatio = {
    small: 0.8,
    medium: 1,
    large: 1.5,
  }[size];

  // Animations
  const scale = useSharedValue(1);
  const contentY = useSharedValue(0);
  const blur = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);

  const handlePressIn = () => {
    setIsPressed(true);
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
    contentY.value = withSpring(-5, { damping: 15, stiffness: 200 });
    blur.value = withTiming(1, { duration: 200 });
    sparkleRotation.value = withSpring(1, { damping: 10, stiffness: 100 });
  };

  const handlePressOut = () => {
    setIsPressed(false);
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    contentY.value = withSpring(0, { damping: 15, stiffness: 200 });
    blur.value = withTiming(0, { duration: 200 });
    sparkleRotation.value = withSpring(0, { damping: 10, stiffness: 100 });
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentY.value }],
  }));

  const blurStyle = useAnimatedStyle(() => ({
    opacity: blur.value,
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(sparkleRotation.value, [0, 1], [0, 45])}deg` },
      { scale: interpolate(sparkleRotation.value, [0, 1], [1, 1.2]) },
    ],
  }));

  const getActionIcon = useCallback(() => {
    if (!actionButton?.icon) return null;
    const icons = {
      follow: <UserPlus size={16} color="white" />,
      add: <Plus size={16} color="white" />,
      heart: <Heart size={16} color="white" />,
      check: <Check size={16} color="white" />,
    };
    return icons[actionButton.icon];
  }, [actionButton?.icon]);

  const Container = onPress ? TouchableOpacity : React.Fragment;
  const containerProps = onPress
    ? {
        onPress,
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
        activeOpacity: 1,
      }
    : {};

  // Calculate height based on size
  const height = size === "small" ? propWidth * 1.2 : propWidth;

  return (
    <Container {...containerProps}>
      <AnimatedYStack
        entering={FadeIn.delay(index * 100).springify()}
        width={propWidth}
        height={height}
        overflow="hidden"
        borderRadius="$6"
        backgroundColor="$background"
        elevation={10}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 8 }}
        shadowOpacity={0.3}
        shadowRadius={20}
        style={cardStyle}
      >
        <Animated.View style={contentStyle}>
          {/* Profile Image */}
          <Image
            recyclingKey={userId}
            source={profilePictureUrl ?? DefaultProfilePicture}
            style={{ width: "100%", aspectRatio }}
            contentFit="cover"
            transition={200}
          />

          {/* Gradient Overlay */}
          {style === "gradient" && (
            <AnimatedLinearGradient
              colors={[
                "transparent",
                "rgba(0,0,0,0.4)",
                isPressed ? "rgba(0,0,0,0.95)" : "rgba(0,0,0,0.8)",
              ]}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "70%",
              }}
            />
          )}

          {/* Glass Effect */}
          {style === "glass" && (
            <AnimatedBlurView
              intensity={20}
              style={[
                {
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "40%",
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
                blurStyle,
              ]}
            />
          )}

          {/* Content Overlay */}
          <YStack
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            p="$3"
            gap="$2"
          >
            {/* Username and Verified Badge */}
            <XStack alignItems="center" gap="$1">
              <Text
                numberOfLines={1}
                fontWeight="700"
                fontSize={size === "small" ? 14 : 16}
                color="white"
                opacity={0.95}
                textShadowColor="rgba(0, 0, 0, 0.5)"
                textShadowOffset={{ width: 0, height: 1 }}
                textShadowRadius={3}
              >
                {username}
              </Text>
              {isVerified && (
                <Animated.View style={sparkleStyle}>
                  <Sparkles
                    size={size === "small" ? 14 : 16}
                    color={getTokens().color.primary.val}
                  />
                </Animated.View>
              )}
            </XStack>

            {/* Bio - Only for medium and large cards */}
            {bio && size !== "small" && (
              <Text
                numberOfLines={2}
                fontSize={12}
                color="white"
                opacity={0.8}
                textShadowColor="rgba(0, 0, 0, 0.3)"
                textShadowOffset={{ width: 0, height: 1 }}
                textShadowRadius={2}
              >
                {bio}
              </Text>
            )}

            {/* Stats - Only for large cards */}
            {stats && size === "large" && (
              <XStack gap="$4" py="$2">
                {Object.entries(stats).map(([key, value]) => (
                  <YStack key={key} alignItems="center">
                    <Text color="white" fontWeight="700">
                      {value}
                    </Text>
                    <Text color="white" opacity={0.7} fontSize={12}>
                      {key}
                    </Text>
                  </YStack>
                ))}
              </XStack>
            )}

            {/* Action Button */}
            {actionButton && (
              <Animated.View entering={FadeIn.delay(index * 100 + 200)}>
                <Button
                  size={size === "small" ? "$2" : "$3"}
                  variant={actionButton.variant ?? "primary"}
                  onPress={actionButton.onPress}
                  icon={getActionIcon()}
                  scaleIcon={0.8}
                  pressStyle={{ opacity: 0.8 }}
                  borderRadius={size === "small" ? "$4" : "$6"}
                >
                  {size !== "small" && actionButton.label}
                </Button>
              </Animated.View>
            )}
          </YStack>
        </Animated.View>
      </AnimatedYStack>
    </Container>
  );
};

UserCard.SeeAll = ({
  width,
  onPress,
  index = 0,
  size = "small",
}: {
  width: number;
  onPress: () => void;
  index?: number;
  size?: "small" | "large";
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scale = useSharedValue(1);
  const contentY = useSharedValue(0);
  const blur = useSharedValue(0);

  // Calculate height based on size
  const height = size === "small" ? width * 1.2 : width;

  const handlePressIn = () => {
    setIsPressed(true);
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
    contentY.value = withSpring(-5, { damping: 15, stiffness: 200 });
    blur.value = withTiming(1, { duration: 200 });
  };

  const handlePressOut = () => {
    setIsPressed(false);
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    contentY.value = withSpring(0, { damping: 15, stiffness: 200 });
    blur.value = withTiming(0, { duration: 200 });
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentY.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <AnimatedYStack
        entering={FadeIn.delay(index * 100).springify()}
        width={width}
        height={height}
        borderRadius="$6"
        backgroundColor="$gray3"
        alignItems="center"
        justifyContent="center"
        gap="$2"
        elevation={10}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 8 }}
        shadowOpacity={0.2}
        shadowRadius={16}
        style={cardStyle}
      >
        <Animated.View style={contentStyle}>
          <YStack alignItems="center" gap="$2">
            <ChevronRight size={24} opacity={0.6} />
            <Text fontSize="$2" fontWeight="500" opacity={0.6}>
              See All
            </Text>
          </YStack>
        </Animated.View>
      </AnimatedYStack>
    </TouchableOpacity>
  );
};

UserCard.Skeleton = ({ width }: { width: number }) => {
  return (
    <YStack
      backgroundColor="$gray3"
      padding="$4"
      borderRadius="$4"
      width={width}
      opacity={0.7}
    >
      <YStack space="$4" alignItems="center">
        {/* Profile picture skeleton */}
        <Circle size={80} backgroundColor="$gray4" />

        {/* Username skeleton */}
        <XStack
          width={100}
          height={16}
          backgroundColor="$gray4"
          borderRadius="$2"
        />

        {/* Button skeleton */}
        <Button
          disabled
          width="100%"
          backgroundColor="$gray4"
          borderColor="transparent"
        >
          <Text color="transparent">Follow</Text>
        </Button>
      </YStack>
    </YStack>
  );
};

export default UserCard;
