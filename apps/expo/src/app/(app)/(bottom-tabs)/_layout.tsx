import * as Haptics from "expo-haptics";
import type { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { Camera, Home, Inbox, Search, User2 } from "@tamagui/lucide-icons";
import { Text, useTheme } from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";
import { BottomTabBar } from "~/components/TabBars";
import { BottomTabs } from "~/layouts";

const BottomTabsLayout = () => {
  const theme = useTheme();

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
          title: "Home",
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
