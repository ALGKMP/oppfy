import React, { useCallback, useMemo } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type {
  BottomTabBarProps,
  BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import { useTheme, XStack, YStack } from "tamagui";

type Route = BottomTabBarProps["state"]["routes"][number];

interface TabButtonProps {
  route: Route;
  isFocused: boolean;
  options: BottomTabNavigationOptions;
  onPress: () => void;
  onLongPress: () => void;
}

const TabButton = React.memo(
  ({ isFocused, options, onPress, onLongPress }: TabButtonProps) => {
    const TabBarIcon = options.tabBarIcon;

    const iconElement = useMemo(() => {
      if (TabBarIcon) {
        return <TabBarIcon focused={isFocused} color="white" size={24} />;
      }
      return null;
    }, [TabBarIcon, isFocused]);

    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tabButton}
      >
        <YStack flex={1} alignItems="center" justifyContent="center">
          {iconElement}
        </YStack>
      </TouchableOpacity>
    );
  },
);

TabButton.displayName = "TabButton";

const BottomTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const theme = useTheme();

  const createTabPressHandler = useCallback(
    (route: Route, isFocused: boolean) => () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    },
    [navigation],
  );

  const createTabLongPressHandler = useCallback(
    (route: Route) => () => {
      navigation.emit({
        type: "tabLongPress",
        target: route.key,
      });
    },
    [navigation],
  );

  const tabButtons = useMemo(
    () =>
      state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        if (!descriptor) {
          throw new Error(
            `No descriptor found for route with key ${route.key}`,
          );
        }
        const { options } = descriptor;
        const isFocused = state.index === index;

        return (
          <TabButton
            key={route.key}
            route={route}
            isFocused={isFocused}
            options={options}
            onPress={createTabPressHandler(route, isFocused)}
            onLongPress={createTabLongPressHandler(route)}
          />
        );
      }),
    [
      state.routes,
      state.index,
      descriptors,
      createTabPressHandler,
      createTabLongPressHandler,
    ],
  );

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ backgroundColor: theme.background.val }}
    >
      <XStack height={50} borderTopWidth={1} borderTopColor="$gray2">
        {tabButtons}
      </XStack>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
  },
});

export default React.memo(BottomTabBar);
