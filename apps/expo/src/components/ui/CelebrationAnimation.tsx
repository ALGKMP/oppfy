import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions } from "react-native";
import DefaultProfilePicture from "@assets/default_profile_picture.jpg";
import { Portal } from "@gorhom/portal";
import { Circle, Image, Stack, Text, YStack } from "tamagui";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CelebrationAnimationProps {
  visible: boolean;
  recipientName: string;
  recipientImage?: string;
  onComplete: () => void;
}

// Array of celebration emojis
const CELEBRATION_EMOJIS = ["🎉", "✨", "⭐", "🔥", "💥"];

const EmojiAnimation = ({ emoji, delay }: { emoji: string; delay: number }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const translateX = useRef(
    new Animated.Value(Math.random() * SCREEN_WIDTH),
  ).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      // Move up from bottom to top (faster)
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 2000, // Reduced from 3000ms to 2000ms
        delay,
        useNativeDriver: true,
      }),
      // Rotate while moving (faster)
      Animated.timing(rotate, {
        toValue: 1,
        duration: 2000, // Reduced from 3000ms to 2000ms
        delay,
        useNativeDriver: true,
      }),
      // Scale animation
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1,
          duration: 150, // Slightly faster pop-in
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: 400, // Faster fade out
          delay: delay + 1600, // Adjusted timing for shorter total duration
          useNativeDriver: true,
        }),
      ]),
      // Add some horizontal drift (faster)
      Animated.timing(translateX, {
        toValue: Math.random() * SCREEN_WIDTH,
        duration: 2000, // Reduced from 3000ms to 2000ms
        delay,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
  }, [animatedValue, delay, rotate, scale, translateX]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT + 50, -100],
  });

  const rotateZ = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        transform: [
          { translateX },
          { translateY },
          { rotate: rotateZ },
          { scale },
        ],
        zIndex: 1000,
      }}
    >
      <Text fontSize={32}>{emoji}</Text>
    </Animated.View>
  );
};

const ProfilePicturePopup = ({
  visible,
  recipientName,
  recipientImage,
  onComplete,
}: {
  visible: boolean;
  recipientName: string;
  recipientImage?: string;
  onComplete: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start the popup animation after a brief delay (made earlier)
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 150,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        // Hide after 2 seconds
        setTimeout(() => {
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 0,
              tension: 150,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onComplete();
          });
        }, 2000);
      }, 200); // Reduced from 500ms to 200ms for earlier popup
    }
  }, [visible, scaleAnim, fadeAnim, onComplete]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 999,
        opacity: fadeAnim,
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <YStack alignItems="center" gap="$4">
          {/* Profile picture with decorative ring */}
          <Stack position="relative">
            <Circle
              size={120}
              backgroundColor="white"
              padding={4}
              shadowColor="$shadowColor"
              shadowOffset={{ width: 0, height: 8 }}
              shadowOpacity={0.3}
              shadowRadius={16}
              elevation={12}
            >
              <Circle size={112} overflow="hidden" backgroundColor="$gray6">
                <Image
                  source={
                    recipientImage
                      ? { uri: recipientImage }
                      : DefaultProfilePicture
                  }
                  width="100%"
                  height="100%"
                />
              </Circle>
            </Circle>

            {/* Success indicator */}
            <Circle
              size={40}
              position="absolute"
              bottom={-5}
              right={-5}
              backgroundColor="#22C55E"
              shadowColor="$shadowColor"
              shadowOffset={{ width: 0, height: 4 }}
              shadowOpacity={0.3}
              shadowRadius={8}
              elevation={8}
            >
              <Text fontSize={20} color="white">
                ✓
              </Text>
            </Circle>
          </Stack>

          {/* Success message */}
          <YStack alignItems="center" gap="$2">
            <Text
              color="white"
              fontSize={20}
              fontWeight="800"
              textAlign="center"
              shadowColor="rgba(0,0,0,0.5)"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={1}
              shadowRadius={4}
            >
              Posted! 🎉
            </Text>
            <Text
              color="white"
              fontSize={16}
              fontWeight="600"
              textAlign="center"
              opacity={0.9}
              shadowColor="rgba(0,0,0,0.3)"
              shadowOffset={{ width: 0, height: 1 }}
              shadowOpacity={1}
              shadowRadius={2}
            >
              {recipientName} will love this!
            </Text>
          </YStack>
        </YStack>
      </Animated.View>
    </Animated.View>
  );
};

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  visible,
  recipientName,
  recipientImage,
  onComplete,
}) => {
  const [showEmojis, setShowEmojis] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowEmojis(true);
      // Clean up emojis after animation completes (adjusted for faster timing)
      setTimeout(() => {
        setShowEmojis(false);
      }, 3000); // Reduced from 4000ms to 3000ms
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Portal>
      {/* Emoji animations */}
      {showEmojis &&
        Array.from({ length: 50 }).map((_, index) => (
          <EmojiAnimation
            key={index}
            emoji={
              CELEBRATION_EMOJIS[
                Math.floor(Math.random() * CELEBRATION_EMOJIS.length)
              ]!
            }
            delay={Math.random() * 800}
          />
        ))}

      {/* Profile picture popup */}
      <ProfilePicturePopup
        visible={visible}
        recipientName={recipientName}
        recipientImage={recipientImage}
        onComplete={onComplete}
      />
    </Portal>
  );
};

export default CelebrationAnimation;
