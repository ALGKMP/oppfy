import { useEffect, useState } from "react";
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

const CameraTabIcon = ({ focused }: { focused: boolean }) => {
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    // Hide tooltip when the tab is focused
    setShowTooltip(!focused);
  }, [focused]);

  return (
    /*     <View position="absolute" top={-50} zIndex={1000000}>
      <Text>hellooo</Text>
    </View> */
    <YStack>
      {/*       {showTooltip && (
        <View position="absolute" top={-50}>
          <Tooltip open>
            <Tooltip.Content
              enterStyle={{ y: -5, opacity: 0, scale: 0.9 }}
              exitStyle={{ y: -5, opacity: 0, scale: 0.9 }}
              y={0}
              opacity={1}
              scale={1}
              animation="quick"
            >
              <Paragraph size="$2" lineHeight="$1">
                Some shit
              </Paragraph>
            </Tooltip.Content>
          </Tooltip>
        </View>
      )} */}
      <View position="absolute" top={-50}>
        <Text>hello</Text>
      </View>
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
