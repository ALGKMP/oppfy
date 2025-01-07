import React from "react";
import { TouchableOpacity } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";

import { Button } from "./Buttons";
import { YStack } from "./Stacks";
import { Text } from "./Texts";

const AnimatedYStack = Animated.createAnimatedComponent(YStack);

export interface UserCardProps {
  userId: string;
  username: string;
  profilePictureUrl: string | null;
  width?: number;
  aspectRatio?: number;
  onPress?: () => void;
  actionButton?: {
    label: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "outline";
  };
  index?: number; // For animation delays in lists
}

export const UserCard = ({
  userId,
  username,
  profilePictureUrl,
  width,
  aspectRatio = 1,
  onPress,
  actionButton,
  index = 0,
}: UserCardProps) => {
  // Animation for the card press
  const cardScale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const handlePressIn = () => {
    cardScale.value = withSpring(0.95, { damping: 10, stiffness: 200 });
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  // Animation for the action button press
  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleActionPress = async () => {
    buttonScale.value = withSpring(0.95, { damping: 10, stiffness: 200 });
    actionButton?.onPress();
  };

  const Content = (
    <>
      <Image
        recyclingKey={userId}
        source={profilePictureUrl ?? DefaultProfilePicture}
        style={{ width: "100%", aspectRatio }}
        contentFit="cover"
        transition={200}
      />

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
        }}
      />

      <YStack position="absolute" bottom={0} left={0} right={0} p="$3" gap="$2">
        <Text
          numberOfLines={1}
          fontWeight="600"
          fontSize={16}
          color="white"
          opacity={0.85}
          textShadowColor="rgba(0, 0, 0, 0.3)"
          textShadowOffset={{ width: 0, height: 1 }}
          textShadowRadius={2}
        >
          {username}
        </Text>

        {actionButton && (
          <Animated.View
            entering={FadeIn.delay(index * 100 + 200)}
            style={buttonStyle}
          >
            <Button
              size="$3"
              variant={actionButton.variant ?? "primary"}
              onPress={handleActionPress}
              pressStyle={{ opacity: 0.8 }}
            >
              {actionButton.label}
            </Button>
          </Animated.View>
        )}
      </YStack>
    </>
  );

  if (!onPress) {
    return (
      <AnimatedYStack
        entering={FadeInDown.delay(index * 100).springify()}
        width={width}
        aspectRatio={aspectRatio}
        overflow="hidden"
        borderRadius="$6"
        backgroundColor="$background"
        elevation={5}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 10 }}
        shadowOpacity={0.2}
        shadowRadius={20}
      >
        {Content}
      </AnimatedYStack>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <AnimatedYStack
        entering={FadeInDown.delay(index * 100).springify()}
        width={width}
        aspectRatio={aspectRatio}
        overflow="hidden"
        borderRadius="$6"
        backgroundColor="$background"
        elevation={5}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 10 }}
        shadowOpacity={0.2}
        shadowRadius={20}
        style={cardStyle}
      >
        {Content}
      </AnimatedYStack>
    </TouchableOpacity>
  );
};
