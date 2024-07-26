import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Text, useTheme, View, XStack } from "tamagui";

const BottomTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const theme = useTheme();

  // Determine if the current screen should hide the tab bar
  const shouldHideTabBar = state.routes[state.index]
    ? (
        descriptors[state.routes[state.index]!.key]?.options
          ?.tabBarStyle as ViewStyle
      )?.display === "none"
    : false;

  if (shouldHideTabBar) {
    return null;
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{
        backgroundColor: theme.background.val,
      }}
    >
      <XStack height="$5" borderTopWidth={1} borderTopColor="$gray2">
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

          const isCamera = route.name === "(camera)";

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
              {isCamera && (
                <View
                  position="absolute"
                  top={-20}
                  backgroundColor="$background"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                >
                  <Text fontSize="$1" color="$color">
                    Some shit
                  </Text>
                </View>
              )}
              {iconElement}
            </TouchableOpacity>
          );
        })}
      </XStack>
    </SafeAreaView>
  );
};

export default BottomTabBar;
