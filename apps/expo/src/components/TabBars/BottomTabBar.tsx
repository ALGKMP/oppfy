import { StyleSheet, TouchableOpacity } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { getTokens, useTheme, XStack } from "tamagui";

const BottomTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{
        backgroundColor: theme.background.val,
      }}
    >
      <XStack height="$6" borderTopWidth={1} borderTopColor="$gray2">
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
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {iconElement}
            </TouchableOpacity>
          );
        })}
      </XStack>
    </SafeAreaView>
  );
};

export default BottomTabBar;
