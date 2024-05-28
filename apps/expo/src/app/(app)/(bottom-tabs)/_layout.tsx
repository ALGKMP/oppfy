import * as Haptics from "expo-haptics";
import type { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { Camera, Home, Inbox, Search, User2 } from "@tamagui/lucide-icons";
import { Text, useTheme } from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";
import { BottomTabBar } from "~/components/TabBars";
import { BottomTabs } from "~/layouts";

const BottomTabsLayout = () => {
  const theme = useTheme();

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
    >
      <BottomTabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <Home strokeWidth={focused ? 2 : 1.5} />,
        }}
      />

      <BottomTabs.Screen
        name="(search)"
        options={{
          header: () => null,
          tabBarIcon: ({ focused }) => (
            <Search strokeWidth={focused ? 2 : 1.5} />
          ),
        }}
      />

      <BottomTabs.Screen
        name="(camera)"
        options={{
          header: () => null,
          tabBarIcon: ({ focused }) => (
            <Camera strokeWidth={focused ? 2 : 1.5} />
          ),
          tabBarStyle: {
            display: "none",
          },
        }}
      />

      <BottomTabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ focused }) => (
            <Inbox strokeWidth={focused ? 2 : 1.5} />
          ),
        }}
      />

      <BottomTabs.Screen
        name="(profile)"
        options={{
          header: () => null,
          tabBarIcon: ({ focused }) => (
            <User2 strokeWidth={focused ? 2 : 1.5} />
          ),
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
