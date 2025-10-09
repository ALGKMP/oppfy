import type { ComponentProps } from "react";
import React, { useCallback } from "react";
import { TouchableOpacity, useWindowDimensions } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Image } from "expo-image";
import DefaultProfilePicture from "@assets/default_profile_picture.jpg";
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

const AnimatedYStack = Animated.createAnimatedComponent(YStack);

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
  style: _style = "gradient",
  onPress,
  actionButton,
  index = 0,
  isVerified,
}: UserCardProps) => {
  const { width: windowWidth } = useWindowDimensions();

  // Dynamic sizing based on card size variant
  const _width =
    propWidth ??
    {
      small: windowWidth * 0.35,
      medium: windowWidth * 0.45,
      large: windowWidth * 0.9,
    }[size];

  // Profile picture size based on card size
  const profileSize = {
    small: propWidth * 0.75,
    medium: propWidth * 0.85,
    large: propWidth * 0.65,
  }[size];

  // Animations
  const scale = useSharedValue(1);
  const contentY = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
    contentY.value = withSpring(-5, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    contentY.value = withSpring(0, { damping: 15, stiffness: 200 });
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentY.value }],
  }));

  const getActionIcon = useCallback(() => {
    if (!actionButton?.icon) return null;
    const icons = {
      follow: <UserPlus size={16} />,
      add: <Plus size={16} />,
      heart: <Heart size={16} />,
      check: <Check size={16} />,
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

  return (
    <Container {...containerProps}>
      <AnimatedYStack
        entering={FadeIn.delay(index * 100).springify()}
        width={propWidth}
        overflow="hidden"
        borderRadius="$8"
        backgroundColor="$background"
        elevation={10}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 8 }}
        shadowOpacity={0.3}
        shadowRadius={20}
        style={cardStyle}
      >
        <Animated.View style={contentStyle}>
          <YStack gap="$3" p="$3" alignItems="center">
            {/* Profile Image */}
            <Image
              recyclingKey={userId}
              source={profilePictureUrl ?? DefaultProfilePicture}
              style={{
                width: profileSize,
                height: profileSize,
                borderRadius: profileSize / 2,
              }}
              contentFit="cover"
              transition={200}
              cachePolicy="none"
            />

            {/* Content */}
            <YStack gap="$2" alignItems="center" width="100%">
              {/* Username and Verified Badge */}
              <XStack alignItems="center" gap="$1">
                <Text
                  numberOfLines={1}
                  fontWeight="700"
                  fontSize={size === "small" ? 14 : 16}
                >
                  {username}
                </Text>
                {isVerified && (
                  <Sparkles
                    size={size === "small" ? 14 : 16}
                    color={getTokens().color.primary.val}
                  />
                )}
              </XStack>

              {/* Bio - Only for medium and large cards */}
              {bio && size !== "small" && (
                <Text
                  numberOfLines={2}
                  fontSize={12}
                  opacity={0.7}
                  textAlign="center"
                  px="$2"
                >
                  {bio}
                </Text>
              )}

              {/* Stats - Only for large cards */}
              {stats && size === "large" && (
                <XStack gap="$4" py="$2">
                  {Object.entries(stats).map(([key, value]) => (
                    <YStack key={key} alignItems="center">
                      <Text fontWeight="700">{value}</Text>
                      <Text opacity={0.7} fontSize={12}>
                        {key}
                      </Text>
                    </YStack>
                  ))}
                </XStack>
              )}

              {/* Action Button */}
              {actionButton && (
                <Animated.View
                  entering={FadeIn.delay(index * 100 + 200)}
                  style={{ width: "100%" }}
                >
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
  // Calculate height based on size
  const height = size === "small" ? width * 1.2 : width;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
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
      >
        <YStack alignItems="center" gap="$2">
          <ChevronRight size={24} opacity={0.6} />
          <Text fontSize="$2" fontWeight="500" opacity={0.6}>
            See All
          </Text>
        </YStack>
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
