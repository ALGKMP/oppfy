import React from "react";
import { View as RNView, StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Calendar,
  Edit3,
  Send,
  Settings2,
  Share2,
} from "@tamagui/lucide-icons";
import { getToken, Text, View, XStack, YStack } from "tamagui";

import Avatar from "~/components/Avatar";
import ActionButton from "~/components/Profile/ActionButton";
import Stats from "~/components/Profile/Stats";
import { Button } from "~/components/ui";
import { Skeleton } from "~/components/ui/Skeleton";
import useProfile from "~/hooks/useProfile";

interface HeaderProps {
  userId?: string;
}

const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedView = Animated.createAnimatedComponent(View);

const styles = StyleSheet.create({
  patternText: {
    position: "absolute",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
});

const Header = ({ userId }: HeaderProps = { userId: undefined }) => {
  const router = useRouter();
  const { profile: profileData, isLoading: isLoadingProfileData } = useProfile({
    userId,
  });

  const [isImageLoaded, setIsImageLoaded] = React.useState(false);

  const defaultProfile = {
    name: "Loading...",
    username: "loading",
    bio: null,
    profilePictureUrl: null,
    followingCount: 0,
    followerCount: 0,
    friendCount: 0,
    postCount: 0,
  };

  const profile = profileData ?? defaultProfile;

  // Animation values
  const gradientProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    // Start continuous gradient animation
    gradientProgress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    // Start pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  // Create abstract pattern elements with animations
  const createAbstractPattern = () => {
    const elements = [];
    const username = profile.username || "";

    // Create floating letters from username
    for (let i = 0; i < username.length; i++) {
      const char = username[i];
      const angle = (i / username.length) * Math.PI * 2;
      const radius = 35 + Math.random() * 10;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;

      const rotation = useSharedValue(angle * (180 / Math.PI));
      const scale = useSharedValue(0.8 + Math.random() * 0.4);

      // Create unique animation for each letter
      React.useEffect(() => {
        rotation.value = withRepeat(
          withTiming(rotation.value + 360, {
            duration: 10000 + Math.random() * 5000,
            easing: Easing.linear,
          }),
          -1,
          true,
        );

        scale.value = withRepeat(
          withSequence(
            withTiming(scale.value * 1.2, {
              duration: 2000 + Math.random() * 1000,
            }),
            withTiming(scale.value, { duration: 2000 + Math.random() * 1000 }),
          ),
          -1,
          true,
        );
      }, []);

      const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
        opacity: withSpring(0.4 + Math.random() * 0.3),
      }));

      elements.push({
        type: "letter",
        char,
        x: x + "%",
        y: y + "%",
        animatedStyle,
      });
    }

    // Add decorative dots
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const radius = 20 + Math.random() * 40;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;

      const dotScale = useSharedValue(1);
      const dotOpacity = useSharedValue(0.1 + Math.random() * 0.2);

      React.useEffect(() => {
        dotScale.value = withRepeat(
          withSequence(
            withDelay(
              Math.random() * 2000,
              withTiming(1.5, { duration: 1500 + Math.random() * 1000 }),
            ),
            withTiming(1, { duration: 1500 + Math.random() * 1000 }),
          ),
          -1,
          true,
        );

        dotOpacity.value = withRepeat(
          withSequence(
            withTiming(0.3, { duration: 2000 }),
            withTiming(0.1, { duration: 2000 }),
          ),
          -1,
          true,
        );
      }, []);

      const animatedDotStyle = useAnimatedStyle(() => ({
        transform: [{ scale: dotScale.value }],
        opacity: dotOpacity.value,
      }));

      elements.push({
        type: "dot",
        x: x + "%",
        y: y + "%",
        size: 2 + Math.random() * 4,
        animatedStyle: animatedDotStyle,
      });
    }

    // Add connecting lines with flow animation
    for (let i = 0; i < 12; i++) {
      const startAngle = (i / 12) * Math.PI * 2;
      const endAngle = ((i + 1) / 12) * Math.PI * 2;
      const radius = 30 + Math.random() * 20;

      const lineProgress = useSharedValue(0);

      React.useEffect(() => {
        lineProgress.value = withRepeat(
          withSequence(
            withDelay(
              i * 200,
              withTiming(1, {
                duration: 2000,
                easing: Easing.inOut(Easing.ease),
              }),
            ),
            withTiming(0, {
              duration: 2000,
              easing: Easing.inOut(Easing.ease),
            }),
          ),
          -1,
          true,
        );
      }, []);

      const animatedLineStyle = useAnimatedStyle(() => ({
        opacity: lineProgress.value * 0.15,
        transform: [{ scaleX: lineProgress.value }],
      }));

      elements.push({
        type: "line",
        x1: 50 + Math.cos(startAngle) * radius + "%",
        y1: 50 + Math.sin(startAngle) * radius + "%",
        x2: 50 + Math.cos(endAngle) * radius + "%",
        y2: 50 + Math.sin(endAngle) * radius + "%",
        animatedStyle: animatedLineStyle,
      });
    }

    return elements;
  };

  // Gradient animation style
  const gradientStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      gradientProgress.value,
      [0, 0.5, 1],
      [
        "rgba(130, 130, 255, 0.2)",
        "rgba(255, 130, 130, 0.2)",
        "rgba(130, 130, 255, 0.2)",
      ],
    );

    return {
      backgroundColor,
    };
  });

  return (
    <YStack>
      {/* Cover Image Area */}
      <YStack height={140} overflow="hidden" borderRadius="$6">
        {profile.profilePictureUrl ? (
          <>
            <Image
              source={profile.profilePictureUrl}
              style={{
                width: "100%",
                height: "100%",
                opacity: isImageLoaded ? 0.6 : 0,
              }}
              contentFit="cover"
              onLoadEnd={() => setIsImageLoaded(true)}
              transition={150}
            />
            <BlurView
              intensity={90}
              tint="light"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255,255,255,0.15)",
              }}
            />

            {/* Animated Gradient Overlay */}
            <Animated.View style={[styles.gradientOverlay, gradientStyle]} />

            {/* Abstract Pattern Overlay */}
            <View
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              overflow="hidden"
            >
              {createAbstractPattern().map((element, i) => {
                if (element.type === "letter") {
                  return (
                    <AnimatedText
                      key={`letter-${i}`}
                      position="absolute"
                      color="white"
                      fontSize={32}
                      fontWeight="900"
                      style={[
                        styles.patternText,
                        {
                          left: element.x,
                          top: element.y,
                        },
                        element.animatedStyle,
                      ]}
                    >
                      {element.char}
                    </AnimatedText>
                  );
                }

                if (element.type === "dot" && element.size !== undefined) {
                  return (
                    <AnimatedView
                      key={`dot-${i}`}
                      position="absolute"
                      backgroundColor="white"
                      style={[
                        {
                          left: element.x,
                          top: element.y,
                          width: element.size,
                          height: element.size,
                          borderRadius: element.size / 2,
                        },
                        element.animatedStyle,
                      ]}
                    />
                  );
                }

                if (element.type === "line") {
                  const x1 = element.x1 || "0%";
                  const y1 = element.y1 || "0%";
                  const x2 = element.x2 || "0%";
                  const y2 = element.y2 || "0%";

                  const x1Num = parseFloat(x1);
                  const y1Num = parseFloat(y1);
                  const x2Num = parseFloat(x2);
                  const y2Num = parseFloat(y2);

                  return (
                    <AnimatedView
                      key={`line-${i}`}
                      position="absolute"
                      backgroundColor="white"
                      style={[
                        {
                          position: "absolute",
                          left: x1,
                          top: y1,
                          width: "1px",
                          height: "1px",
                          transform: [
                            {
                              rotate:
                                Math.atan2(y2Num - y1Num, x2Num - x1Num) +
                                "rad",
                            },
                            {
                              scaleX: Math.hypot(x2Num - x1Num, y2Num - y1Num),
                            },
                          ] as any,
                          transformOrigin: "0 0",
                        },
                        element.animatedStyle,
                      ]}
                    />
                  );
                }
              })}
            </View>

            {/* Join Date Pill - Now at bottom right */}
            <XStack
              position="absolute"
              bottom={12}
              right={12}
              alignItems="center"
              gap="$2"
              opacity={0.9}
              backgroundColor="rgba(0,0,0,0.4)"
              paddingHorizontal="$3.5"
              paddingVertical="$2"
              borderRadius="$12"
            >
              <Calendar size={14} color="white" />
              <Text color="white" fontSize="$2" fontWeight="700">
                Joined 2024
              </Text>
            </XStack>
          </>
        ) : (
          <View
            backgroundColor="$gray3"
            opacity={0.6}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        )}
      </YStack>

      {/* Profile Info Section */}
      <YStack marginTop={-60} paddingHorizontal="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="flex-end">
          {/* Avatar and Name */}
          <YStack>
            <Avatar source={profile.profilePictureUrl} size={110} bordered />
            <YStack paddingTop="$3" gap="$1">
              {isLoadingProfileData ? (
                <>
                  <Skeleton width={150} height={28} />
                  <Skeleton width={100} height={16} />
                </>
              ) : (
                <>
                  <Text
                    height={28}
                    fontWeight="700"
                    fontSize="$7"
                    color="$color"
                  >
                    {profile.name}
                  </Text>
                  <Text height={16} fontSize="$3" color="$color" opacity={0.6}>
                    @{profile.username}
                  </Text>
                </>
              )}
            </YStack>
          </YStack>

          {/* Quick Action Buttons */}
          {!userId ? (
            <XStack gap="$3" paddingBottom="$1">
              <Button
                icon={<Settings2 size={20} />}
                variant="outlined"
                size="$3.5"
                circular
                borderWidth={1.5}
                onPress={() => router.push("/(app)/(settings)")}
                disabled={isLoadingProfileData}
                opacity={isLoadingProfileData ? 0.5 : 1}
              />
            </XStack>
          ) : (
            <XStack gap="$3" paddingBottom="$1">
              <Button
                icon={<Send size={20} />}
                variant="outlined"
                size="$3.5"
                circular
                borderWidth={1.5}
                disabled={isLoadingProfileData}
                opacity={isLoadingProfileData ? 0.5 : 1}
              />
            </XStack>
          )}
        </XStack>

        {/* Bio */}
        {profile.bio && (
          <Text
            fontSize="$4"
            color="$color"
            opacity={isLoadingProfileData ? 0.5 : 0.8}
            lineHeight={22}
          >
            {profile.bio}
          </Text>
        )}

        {/* Action Buttons */}
        <ActionButton userId={userId} />

        {/* Stats */}
        <Stats
          userId={userId}
          username={profile.username}
          postCount={profile.postCount}
          followingCount={profile.followingCount}
          followerCount={profile.followerCount}
          friendCount={profile.friendCount}
          isLoading={isLoadingProfileData}
        />
      </YStack>
    </YStack>
  );
};

export default Header;
