import { TouchableOpacity } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { XStack } from "tamagui";

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
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
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

export default TabBar;
