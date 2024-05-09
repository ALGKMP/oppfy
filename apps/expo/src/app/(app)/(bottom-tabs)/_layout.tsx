import { Pressable, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type {
  BottomTabBarProps,
  BottomTabHeaderProps,
} from "@react-navigation/bottom-tabs";
import {
  Camera,
  Home,
  Inbox,
  MoreHorizontal,
  Search,
  User2,
} from "@tamagui/lucide-icons";
import { Text, useTheme, View, XStack } from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";
import { BottomTabs } from "~/layouts";

const BottomTabsLayout = () => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.background.val,
      }}
    >
      <BottomTabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          header: (props) => <Header {...props} />,
        }}
      >
        <BottomTabs.Screen
          name="(top-tabs)"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => (
              <Home strokeWidth={focused ? 2 : 1.5} />
            ),
          }}
        />

        <BottomTabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ focused }) => (
              <Search strokeWidth={focused ? 2 : 1.5} />
            ),
          }}
        />

        <BottomTabs.Screen
          name="camera"
          options={{
            title: "Camera",
            tabBarIcon: ({ focused }) => (
              <Camera strokeWidth={focused ? 2 : 1.5} />
            ),
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
            title: "Profile",
            tabBarIcon: ({ focused }) => (
              <User2 strokeWidth={focused ? 2 : 1.5} />
            ),
            headerLeft: () => null,
            headerRight: () => (
              <View>
                <Pressable onPress={() => router.push("/(app)/(settings)")}>
                  {({ pressed }) => (
                    <MoreHorizontal
                      size="$1"
                      style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </View>
            ),
          }}
        />
      </BottomTabs>
    </SafeAreaView>
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

const TabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <XStack paddingTop="$4" paddingBottom="$2">
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]!;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        const TabBarIcon = options.tabBarIcon;
        const iconElement = TabBarIcon ? (
          <TabBarIcon focused={isFocused} color="white" size={24} />
        ) : null;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            {iconElement}
          </TouchableOpacity>
        );
      })}
    </XStack>
  );
};

export default BottomTabsLayout;
