import { useEffect, useState } from "react";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import * as Haptics from "expo-haptics";
import type { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { Camera, Home, Inbox, Search, User2 } from "@tamagui/lucide-icons";
import { Circle, Text, useTheme, View, YStack } from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";
import { BottomTabBar } from "~/components/TabBars";
import { BottomTabs } from "~/layouts";
import { api } from "~/utils/api";

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

const BottomTabsLayout = () => {
  const theme = useTheme();
  const utils = api.useUtils();

  const { data: unreadNotificationsCount } =
    api.notifications.getUnreadNotificationsCount.useQuery();

  useEffect(() => {
    const prefetch = async () => {
      await utils.profile.getFullProfileSelf.prefetch();
    };
    void prefetch();
  }, [utils.profile.getFullProfileSelf]);

  const getTabBarIcon =
    (IconComponent: React.ElementType) =>
    ({ focused, ...props }: TabBarIconProps) => (
      <IconComponent strokeWidth={focused ? 3 : 1.5} {...props} />
    );

  return (
    <BottomTabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        header: (props) => <Header {...props} />,
      }}
      sceneContainerStyle={{
        backgroundColor: theme.background.val,
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
          tabBarIcon: ({ focused, ...props }) => (
            <YStack>
              <Inbox strokeWidth={focused ? 3 : 1.5} {...props} />
              {(unreadNotificationsCount ?? 0) > 0 && (
                <Circle
                  size={12}
                  backgroundColor="$red9"
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -3,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              )}
            </YStack>
          ),
        }}
        listeners={{
          focus: () => {
            void utils.notifications.getUnreadNotificationsCount.setData(
              undefined,
              0,
            );
          },
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

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const CameraTabIcon = ({ focused }: { focused: boolean }) => {
  const [showTooltip, setShowTooltip] = useState(true);
  const gradientX1 = useSharedValue(0);
  const gradientY1 = useSharedValue(0);
  const gradientX2 = useSharedValue(1);
  const gradientY2 = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    setShowTooltip(!focused);

    gradientX1.value = withRepeat(
      withTiming(1, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    gradientY1.value = withRepeat(
      withTiming(1, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    gradientX2.value = withRepeat(
      withTiming(0, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    gradientY2.value = withRepeat(
      withTiming(0, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    pulseScale.value = withRepeat(
      withTiming(1.05, {
        duration: 1000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [focused, gradientX1, gradientX2, gradientY1, gradientY2, pulseScale]);

  const animatedGradientProps = useAnimatedProps(() => ({
    x1: `${gradientX1.value * 100}%`,
    y1: `${gradientY1.value * 100}%`,
    x2: `${gradientX2.value * 100}%`,
    y2: `${gradientY2.value * 100}%`,
  }));

  const animatedSvgProps = useAnimatedProps(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <YStack alignItems="center">
      {showTooltip && (
        <View position="absolute" bottom={40} width={140} height={60}>
          <AnimatedSvg
            width={140}
            height={60}
            viewBox="-10 -10 140 60"
            style={{ position: "absolute", top: 0, left: 0 }}
            animatedProps={animatedSvgProps}
          >
            <Defs>
              <AnimatedLinearGradient
                id="rainbow"
                animatedProps={animatedGradientProps}
              >
                <Stop offset="0%" stopColor="#FF0000" />
                <Stop offset="16.67%" stopColor="#FF7F00" />
                <Stop offset="33.33%" stopColor="#FFFF00" />
                <Stop offset="50%" stopColor="#00FF00" />
                <Stop offset="66.67%" stopColor="#0000FF" />
                <Stop offset="83.33%" stopColor="#4B0082" />
                <Stop offset="100%" stopColor="#9400D3" />
              </AnimatedLinearGradient>
            </Defs>
            <Path
              d="M10 0 H110 A10 10 0 0 1 120 10 V25 A10 10 0 0 1 110 35 H65 L60 40 L55 35 H10 A10 10 0 0 1 0 25 V10 A10 10 0 0 1 10 0 Z"
              fill="#000000"
              stroke="url(#rainbow)"
              strokeWidth={4}
            />
          </AnimatedSvg>
          <Text
            color="white"
            fontSize={16}
            position="absolute"
            top={17}
            left={10}
            right={10}
            textAlign="center"
          >
            Take a photo
          </Text>
        </View>
      )}
      <Camera strokeWidth={focused ? 3 : 1.5} />
    </YStack>
  );
};

type HeaderProps = BottomTabHeaderProps;

const Header = ({ options }: HeaderProps) => (
  <BaseHeader
    HeaderLeft={
      options.headerLeft
        ? options.headerLeft({
            labelVisible: options.tabBarShowLabel,
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
            pressColor: options.headerPressColor,
            pressOpacity: options.headerPressOpacity,
            tintColor: options.headerTintColor,
          })
        : undefined
    }
  />
);

export default BottomTabsLayout;
