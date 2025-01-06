import React, { useEffect, useState, type ElementType } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import type { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { Camera, Home, Inbox, Search, User2 } from "@tamagui/lucide-icons";
import { MotiView } from "moti";
import { useTheme } from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";
import { BottomTabBar } from "~/components/TabBars";
import {
  Button,
  Circle,
  H3,
  Paragraph,
  Text,
  useBottomSheetController,
  View,
  YStack,
} from "~/components/ui";
import { BottomSheet } from "~/components/ui/BottomSheet/BottomSheet";
import { BottomTabs } from "~/layouts";
import { api } from "~/utils/api";
import { storage } from "~/utils/storage";

const HAS_SEEN_WELCOME_KEY = "has_seen_welcome";

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

const BottomTabsLayout = () => {
  const theme = useTheme();
  const utils = api.useUtils();
  const bottomSheet = useBottomSheetController();

  const { data: unreadNotificationsCount } =
    api.notifications.getUnreadNotificationsCount.useQuery();

  useEffect(() => {
    const prefetch = async () => {
      await utils.profile.getFullProfileSelf.prefetch();
    };
    void prefetch();
  }, [utils.profile.getFullProfileSelf]);

  useEffect(() => {
    const hasSeenWelcome = storage.getBoolean(HAS_SEEN_WELCOME_KEY);
    const isDev = process.env.NODE_ENV === "development";
    if (isDev || !hasSeenWelcome) {
      // 1 second delay
      setTimeout(() => {
        bottomSheet.show({
          snapPoints: ["100%"],
          headerShown: false,
          enableDismissOnClose: false,
          enablePanDownToClose: false,
          enableHandlePanningGesture: false,
          enableContentPanningGesture: false,
          children: <WelcomeBottomSheet onComplete={handleDismissWelcome} />,
        });
      }, 1000);
    }
  }, []);

  const handleDismissWelcome = () => {
    storage.set(HAS_SEEN_WELCOME_KEY, true);
    bottomSheet.hide();
  };

  const getTabBarIcon =
    (IconComponent: ElementType) =>
    ({ focused, ...props }: TabBarIconProps) => (
      <IconComponent strokeWidth={focused ? 3 : 1.5} {...props} />
    );

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
          right: -6,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          overflow: "hidden",
        }}
      >
        <BlurView
          intensity={100}
          tint="dark"
          style={{ ...StyleSheet.absoluteFillObject }}
        />
        <View
          backgroundColor="$red8"
          opacity={0.8}
          style={{
            ...StyleSheet.absoluteFillObject,
          }}
        />
        <Text
          color="white"
          fontSize={10}
          fontWeight="bold"
          textAlign="center"
          style={{
            paddingHorizontal: 4,
            lineHeight: 18,
          }}
        >
          {count > 99 ? "99+" : count}
        </Text>
      </MotiView>
    );
  };

  return (
    <BottomTabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        header: (props) => <Header {...props} />,
        headerStyle: {
          backgroundColor: theme.background.val,
        },
      }}
      screenListeners={{
        tabPress: () =>
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
      }}
      backBehavior="history"
    >
      <BottomTabs.Screen
        name="(home)"
        options={{
          header: () => null,
          tabBarIcon: getTabBarIcon(Home),
        }}
      />

      <BottomTabs.Screen
        name="(search)"
        options={{
          header: () => null,
          tabBarIcon: getTabBarIcon(Search),
        }}
      />

      <BottomTabs.Screen
        name="(camera)"
        options={{
          header: () => null,
          tabBarIcon: getTabBarIcon(Camera),
        }}
      />

      <BottomTabs.Screen
        name="(inbox)"
        options={{
          header: () => null,
          tabBarIcon: (props) => (
            <View>
              {getTabBarIcon(Inbox)(props)}
              {(unreadNotificationsCount ?? 0) > 0 && (
                <NotificationBadge count={unreadNotificationsCount ?? 0} />
              )}
            </View>
          ),
        }}
      />

      <BottomTabs.Screen
        name="(profile)"
        options={{
          header: () => null,
          tabBarIcon: getTabBarIcon(User2),
        }}
      />
    </BottomTabs>
  );
};

interface FeatureProps {
  emoji: string;
  title: string;
  description: string;
}

type HeaderProps = BottomTabHeaderProps;

const Header = ({ options }: HeaderProps) => (
  <BaseHeader
    HeaderLeft={
      options.headerLeft
        ? options.headerLeft({
            canGoBack: false,
            pressColor: options.headerPressColor,
            pressOpacity: options.headerPressOpacity,
            tintColor: options.headerTintColor,
          })
        : undefined
    }
    HeaderTitle={
      typeof options.headerTitle === "function" ? (
        options.headerTitle({
          children: options.title ?? "",
          tintColor: options.headerTintColor,
          allowFontScaling: options.tabBarAllowFontScaling,
        })
      ) : options.title ? (
        <Text fontSize="$5" fontWeight="bold">
          {options.title}
        </Text>
      ) : null
    }
    HeaderRight={
      options.headerRight
        ? options.headerRight({
            canGoBack: false,
            pressColor: options.headerPressColor,
            pressOpacity: options.headerPressOpacity,
            tintColor: options.headerTintColor,
          })
        : undefined
    }
  />
);

// const SECONDARY_COLOR = "#A608EF"; // a deeper purple to blend nicely with pink
// hot pink
const STARTING_COLOR = "#a819b0";
const ENDING_COLOR = "#F214FF";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const Feature = ({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) => (
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
      <YStack alignItems="center" gap="$2">
        <Circle size={120} backgroundColor="$gray6" opacity={0.9}>
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
            <Text fontSize={70}>📸</Text>
          </MotiView>
        </Circle>
        <H3
          color="white"
          textAlign="center"
          fontSize={32}
          fontWeight="bold"
          opacity={0.95}
        >
          Welcome to Oppfy
        </H3>
        <Paragraph color="white" textAlign="center" opacity={0.8} fontSize={16}>
          Where friends capture your authentic moments
        </Paragraph>
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
            Let's Get Opping
          </Button>
        </MotiView>
      </YStack>
    </YStack>
  );
};

export default BottomTabsLayout;
