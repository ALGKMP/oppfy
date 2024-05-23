import { useMemo } from "react";
import { Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import {
  Camera,
  Home,
  Inbox,
  MoreHorizontal,
  Search,
  User2,
} from "@tamagui/lucide-icons";
import { Text, useTheme, View } from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";
import { BottomTabBar } from "~/components/TabBars";
import { BottomTabs } from "~/layouts";
import { api } from "~/utils/api";

const BottomTabsLayout = () => {
  const theme = useTheme();
  const router = useRouter();

  const { data: profileData } = api.profile.getFullProfileSelf.useQuery();

  return (
    <BottomTabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        header: (props) => <Header {...props} />,
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
        name="(self-profile)"
        options={{
          title: profileData?.username,
          tabBarIcon: ({ focused }) => (
            <User2 strokeWidth={focused ? 2 : 1.5} />
          ),
          headerLeft: () => null,
          headerRight: () => (
            <View>
              <Pressable onPress={() => router.push("/(app)/(settings)")}>
                {({ pressed }) => (
                  <MoreHorizontal style={{ opacity: pressed ? 0.5 : 1 }} />
                )}
              </Pressable>
            </View>
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
