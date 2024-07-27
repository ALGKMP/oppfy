import { useEffect, useState } from "react";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { LinearGradient, Path, Stop } from "react-native-svg";
import * as Haptics from "expo-haptics";
import type { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import {
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Home,
  Inbox,
  Search,
  User2,
} from "@tamagui/lucide-icons";
import {
  Button,
  Paragraph,
  Text,
  Tooltip,
  TooltipGroup,
  TooltipProps,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";
import { BottomTabBar } from "~/components/TabBars";
import { useSession } from "~/contexts/SessionContext";
import { BottomTabs } from "~/layouts";
import { api } from "~/utils/api";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const CameraTabIcon = ({ focused }: { focused: boolean }) => {
  const [showTooltip, setShowTooltip] = useState(true);
  const gradientOffset = useSharedValue(0);

  useEffect(() => {
    setShowTooltip(!focused);

    gradientOffset.value = withRepeat(
      withTiming(1, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1,
      true,
    );
  }, [focused]);

  const animatedGradientProps = useAnimatedProps(() => ({
    x1: `${gradientOffset.value * 200 - 50}%`,
    x2: `${gradientOffset.value * 200 + 50}%`,
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
          >
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
            <Path
              d="M10 0 H110 A10 10 0 0 1 120 10 V25 A10 10 0 0 1 110 35 H65 L60 40 L55 35 H10 A10 10 0 0 1 0 25 V10 A10 10 0 0 1 10 0 Z"
              fill="#000000"
              stroke="url(#rainbow)"
              strokeWidth={4}
            />
          </AnimatedSvg>
          <Text
            color="white"
            fontSize={12}
            position="absolute"
            top={20}
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

const BottomTabsLayout = () => {
  const theme = useTheme();
  const { user } = useSession();
  const utils = api.useUtils();

  useEffect(() => {
    const prefetch = async () => {
      await utils.profile.getFullProfileSelf.prefetch();
    };
    void prefetch();
  }, [utils.profile.getFullProfileSelf]);

  const thing = utils.profile.getFullProfileSelf.getData();

  const getTabBarIcon =
    (IconComponent: React.ElementType) =>
    ({ focused }: { focused: boolean }) => (
      <IconComponent strokeWidth={focused ? 3 : 1.5} />
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
          tabBarIcon: CameraTabIcon,
        }}
      />

      <BottomTabs.Screen
        name="(inbox)"
        options={{
          header: () => null,
          tabBarIcon: getTabBarIcon(Inbox),
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
