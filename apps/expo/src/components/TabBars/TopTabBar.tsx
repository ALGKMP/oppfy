import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type {
  BottomTabBarProps,
  BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import { useTheme, XStack, YStack } from "tamagui";

const BottomTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const theme = useTheme();

  const shouldHideTabBar = useMemo(() => {
    const currentRoute = state.routes[state.index];
    if (!currentRoute) return false;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { options } = descriptors[currentRoute.key]!;
    return (options.tabBarStyle as { display?: string }).display === "none";
  }, [state.routes, state.index, descriptors]);

  if (shouldHideTabBar) {
    return null;
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ backgroundColor: theme.background.val }}
    >
      <XStack height="$6" borderTopWidth={1} borderTopColor="$gray2">
        {state.routes.map((route, index) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

          return (
            <TabButton
              key={route.key}
              route={route}
              isFocused={isFocused}
              options={options}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </XStack>
    </SafeAreaView>
  );
};

interface TabButtonProps {
  route: BottomTabBarProps["state"]["routes"][number];
  isFocused: boolean;
  options: BottomTabNavigationOptions;
  onPress: () => void;
  onLongPress: () => void;
}

const TabButton = ({
  isFocused,
  options,
  onPress,
  onLongPress,
}: TabButtonProps) => {
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
      testID={options.tabBarTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={{ flex: 1 }}
    >
      <YStack flex={1} alignItems="center" justifyContent="center">
        {iconElement}
      </YStack>
    </TouchableOpacity>
  );
};

export default React.memo(BottomTabBar);
