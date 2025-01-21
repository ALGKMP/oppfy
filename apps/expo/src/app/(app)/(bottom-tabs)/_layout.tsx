import React, { useEffect, useState } from "react";
import type { ElementType } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { MotiView } from "moti";
import { useTheme } from "tamagui";

import { BottomTabs } from "~/components/Layouts/Navigation";
import {
  Avatar,
  Button,
  Circle,
  H3,
  Icon,
  Paragraph,
  Text,
  useBottomSheetController,
  View,
  YStack,
} from "~/components/ui";
import type { IconName } from "~/components/ui";
import { api } from "~/utils/api";
import { storage } from "~/utils/storage";

const HAS_SEEN_WELCOME_KEY = "has_seen_welcome";

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

const BottomTabsLayout = () => {
  const utils = api.useUtils();
  const bottomSheet = useBottomSheetController();

  const { data: unreadNotificationsCount } =
    api.notifications.getUnreadNotificationsCount.useQuery();

  // useEffect(() => {
  //   const prefetch = async () => {
  //     await utils.profile.getFullProfileSelf.prefetch();
  //   };
  //   void prefetch();
  // }, [utils.profile.getFullProfileSelf]);

  useEffect(() => {
    const hasSeenWelcome = storage.getBoolean(HAS_SEEN_WELCOME_KEY);
    const isDev = process.env.NODE_ENV === "development";
    if (isDev || !hasSeenWelcome) {
      // 1 second delay
      setTimeout(() => {
        bottomSheet.show({
          snapPoints: ["100%"],
          headerShown: false,
          enablePanDownToClose: false,
          enableHandlePanningGesture: false,
          enableContentPanningGesture: false,
          children: <WelcomeBottomSheet onComplete={handleDismissWelcome} />,
        });
      }, 1000);
    }
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismissWelcome = () => {
    storage.set(HAS_SEEN_WELCOME_KEY, true);
    bottomSheet.hide();
  };

  const getTabBarIcon =
    (iconName: IconName) =>
    ({ focused, color, size }: TabBarIconProps) => {
      const animatedStyle = useAnimatedStyle(() => ({
        transform: [
          {
            scale: withSpring(focused ? 1.1 : 1, {
              mass: 0.5,
              damping: 12,
              stiffness: 100,
            }),
          },
        ],
      }));

      return (
        <Animated.View style={animatedStyle}>
          <Icon
            name={iconName}
            color={color}
            size={size}
            iconStyle={{
              opacity: focused ? 1 : 0.5,
            }}
          />
        </Animated.View>
      );
    };

  const NotificationBadge = ({ count }: { count: number }) => {
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          opacity: {
            type: "timing",
            duration: 300,
          },
          scale: {
            type: "timing",
            duration: 300,
          },
        }}
        style={{
          position: "absolute",
          top: -6,
          left: 12,
          minWidth: 18,
          height: 18,
          paddingHorizontal: 4,
          borderRadius: 9,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          transform: [{ translateX: 0 }],
        }}
      >
        <BlurView
          intensity={100}
          tint="dark"
          style={{ ...StyleSheet.absoluteFillObject }}
        />
        <View
          backgroundColor="$red11"
          opacity={0.8}
          style={{
            ...StyleSheet.absoluteFillObject,
          }}
        />
        <Text color="white" fontSize={10} fontWeight="bold" textAlign="center">
          {count > 99 ? "99+" : count}
        </Text>
      </MotiView>
    );
  };

  return (
    <BottomTabs screenOptions={{ headerShown: false }} backBehavior="history">
      <BottomTabs.Screen
        name="(home)"
        options={{
          tabBarIcon: getTabBarIcon("home"),
        }}
      />

      <BottomTabs.Screen
        name="(search)"
        options={{
          tabBarIcon: getTabBarIcon("search"),
        }}
      />

      <BottomTabs.Screen
        name="(camera)"
        options={{
          tabBarIcon: getTabBarIcon("camera"),
        }}
      />

      <BottomTabs.Screen
        name="(inbox)"
        options={{
          tabBarIcon: (props) => (
            <View>
              {getTabBarIcon("notifications")(props)}
              {(unreadNotificationsCount ?? 0) > 0 && (
                <NotificationBadge count={unreadNotificationsCount ?? 0} />
              )}
            </View>
          ),
          tabBarButton: (props) => (
            <Pressable
              {...props}
              onPress={(event) => {
                props.onPress?.(event);
                if (unreadNotificationsCount && unreadNotificationsCount > 0) {
                  utils.notifications.getUnreadNotificationsCount.setData(
                    undefined,
                    0,
                  );
                }
              }}
            />
          ),
        }}
      />

      <BottomTabs.Screen
        name="(profile)"
        options={{
          tabBarIcon: ({ focused, size }) => {
            const animatedStyle = useAnimatedStyle(() => ({
              transform: [
                {
                  scale: withSpring(focused ? 1.1 : 1, {
                    mass: 0.5,
                    damping: 12,
                    stiffness: 100,
                  }),
                },
              ],
            }));

            return (
              <Animated.View style={animatedStyle}>
                <Avatar
                  // source={profile?.profilePictureUrl ?? DefaultProfilePicture}
                  size={size}
                  bordered={focused}
                  style={{ opacity: focused ? 1 : 0.5 }}
                />
              </Animated.View>
            );
          },
        }}
      />
    </BottomTabs>
  );
};

interface FeatureProps {
  icon: string;
  title: string;
  description: string;
}

const STARTING_COLOR = "#a819b0";
const ENDING_COLOR = "#F214FF";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const Feature = ({ icon, title, description }: FeatureProps) => (
  <YStack gap="$2" alignItems="flex-start">
    <Text fontSize={28}>{icon}</Text>
    <YStack gap="$1">
      <Text color="$color" fontSize={18} fontWeight="bold">
        {title}
      </Text>
      <Text color="$color" fontSize={14} opacity={0.8}>
        {description}
      </Text>
    </YStack>
  </YStack>
);

export const WelcomeBottomSheet = ({
  onComplete,
}: {
  onComplete: () => void;
}) => {
  const theme = useTheme();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  // Create a pulsing animation
  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.15, {
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 30000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, []);

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    };
  });

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeWidth: 2 + scale.value,
    };
  });

  const handleComplete = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete();
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$primary"
      padding="$4"
      paddingTop="$8"
      position="relative"
      borderTopLeftRadius="$8"
      borderTopRightRadius="$8"
      overflow="hidden"
      gap="$6"
    >
      {/* Decorative background elements */}
      <AnimatedSvg
        style={[{ position: "absolute", top: -100, right: -100 }, rStyle]}
        width={400}
        height={400}
      >
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={STARTING_COLOR} stopOpacity="0.3" />
            <Stop offset="1" stopColor={ENDING_COLOR} stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        <AnimatedPath
          d="M100,100 C150,50 200,150 250,100 S350,50 400,100 S500,150 450,200 S350,250 300,200 S200,150 150,200 S50,250 100,200 S150,150 100,100"
          fill="url(#grad)"
          stroke={ENDING_COLOR}
          animatedProps={animatedProps}
        />
      </AnimatedSvg>

      {/* Header */}
      <YStack alignItems="center" gap="$4">
        <MotiView
          from={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            scale: {
              type: "spring",
              delay: 300,
              damping: 12,
              stiffness: 100,
            },
            opacity: {
              type: "timing",
              duration: 600,
              delay: 300,
            },
          }}
        >
          <YStack
            alignItems="center"
            justifyContent="center"
            position="relative"
          >
            {/* Camera Body */}
            <Circle
              size={70}
              backgroundColor="white"
              borderWidth={3}
              borderColor="$primary"
              shadowColor="$primary"
              shadowOpacity={0.3}
              shadowRadius={10}
            >
              {/* Camera Lens */}
              <Circle
                size={40}
                backgroundColor="$primary"
                borderWidth={2}
                borderColor="white"
                shadowColor="$primary"
                shadowOpacity={0.2}
                shadowRadius={5}
              >
                {/* Inner Lens Ring */}
                <Circle size={25} backgroundColor="white" opacity={0.3} />
              </Circle>
            </Circle>

            {/* Camera Flash */}
            <Circle
              position="absolute"
              top={5}
              right={5}
              size={15}
              backgroundColor="white"
              borderWidth={2}
              borderColor="$primary"
              animation="bouncy"
              enterStyle={{ scale: 0.5, opacity: 0 }}
              exitStyle={{ scale: 0.5, opacity: 0 }}
              pressStyle={{ scale: 0.9 }}
            />

            {/* Animated Sparkle Effects */}
            <MotiView
              from={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{
                loop: true,
                repeatReverse: false,
                duration: 2000,
              }}
              style={{
                position: "absolute",
                top: -10,
                right: -10,
              }}
            >
              <Icon name="ellipse" size={15} color="white" />
            </MotiView>
            <MotiView
              from={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{
                loop: true,
                repeatReverse: false,
                duration: 2000,
                delay: 500,
              }}
              style={{
                position: "absolute",
                bottom: -5,
                left: -5,
              }}
            >
              <Icon name="ellipse" size={12} color="white" />
            </MotiView>
          </YStack>
        </MotiView>

        <YStack gap="$2">
          <H3
            color="white"
            textAlign="center"
            fontSize={32}
            fontWeight="bold"
            opacity={0.95}
          >
            Welcome to Oppfy
          </H3>
          <Paragraph
            color="white"
            textAlign="center"
            opacity={0.8}
            fontSize={16}
          >
            Where friends capture your authentic moments
          </Paragraph>
        </YStack>
      </YStack>

      {/* Features */}
      <YStack paddingHorizontal="$2" gap="$6">
        <MotiView
          from={{ translateX: -100, opacity: 0 }}
          animate={{ translateX: 0, opacity: 1 }}
          transition={{
            translateX: {
              type: "spring",
              delay: 400,
              damping: 15,
              stiffness: 100,
            },
            opacity: {
              type: "timing",
              duration: 600,
              delay: 400,
            },
          }}
        >
          <Feature
            icon="🤳"
            title="Friends Are Your Photographers"
            description="Let your friends capture and post your candid moments - no selfies allowed!"
          />
        </MotiView>

        <MotiView
          from={{ translateX: 100, opacity: 0 }}
          animate={{ translateX: 0, opacity: 1 }}
          transition={{
            translateX: {
              type: "spring",
              delay: 600,
              damping: 15,
              stiffness: 100,
            },
            opacity: {
              type: "timing",
              duration: 600,
              delay: 600,
            },
          }}
        >
          <Feature
            icon="✨"
            title="Real & Unfiltered"
            description="Experience life through others' eyes - raw, authentic, and spontaneous"
          />
        </MotiView>

        <MotiView
          from={{ translateX: -100, opacity: 0 }}
          animate={{ translateX: 0, opacity: 1 }}
          transition={{
            translateX: {
              type: "spring",
              delay: 800,
              damping: 15,
              stiffness: 100,
            },
            opacity: {
              type: "timing",
              duration: 600,
              delay: 800,
            },
          }}
        >
          <Feature
            icon="🎭"
            title="No More Perfect Poses"
            description="Say goodbye to staged photos - embrace the beauty of natural moments"
          />
        </MotiView>
      </YStack>

      {/* Get Started Button */}
      <YStack
        position="absolute"
        bottom={40}
        left={0}
        right={0}
        paddingHorizontal="$4"
      >
        <MotiView
          from={{ translateY: 100, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{
            translateY: {
              type: "spring",
              delay: 1000,
              damping: 20,
              stiffness: 120,
            },
            opacity: {
              type: "timing",
              duration: 600,
              delay: 1000,
            },
          }}
        >
          <Button
            size="$6"
            variant="white"
            onPress={handleComplete}
            fontWeight="bold"
          >
            Let's Get Started
          </Button>
        </MotiView>
      </YStack>
    </YStack>
  );
};

export default BottomTabsLayout;
