import { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import type { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { useTheme, View } from "tamagui";

const TopTabBar = ({
  state,
  descriptors,
  navigation,
  position: externalPosition,
}: MaterialTopTabBarProps) => {
  const theme = useTheme();

  const screenWidth = Dimensions.get("window").width;
  const indicatorWidth = screenWidth / state.routes.length;

  // Create a local animated value
  const [translateX] = useState(
    new Animated.Value(state.index * indicatorWidth),
  );

  // Set up local animation based on external position changes
  useEffect(() => {
    const id = externalPosition.addListener(({ value }) => {
      translateX.setValue(value * indicatorWidth);
    });

    return () => {
      externalPosition.removeListener(id);
    };
  }, [externalPosition, indicatorWidth, translateX]);

  const styles = StyleSheet.create({
    tabBar: {
      flexDirection: "row",
      height: 50,
      alignItems: "center",
      justifyContent: "space-evenly",
      backgroundColor: theme.background.val,
      elevation: 5,
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      padding: 10,
    },
    tabText: {
      fontWeight: "bold",
      color: "white",
    },
    indicator: {
      position: "absolute",
      bottom: 0,
      height: 2,
      width: indicatorWidth,
      backgroundColor: "white",
      transform: [{ translateX }],
    },
  });

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { options } = descriptors[route.key]!;
        const label = options.tabBarLabel ?? options.title ?? route.name;

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

        const inputRange = state.routes.map((_, i) => i);
        const opacity = externalPosition.interpolate({
          inputRange,
          outputRange: inputRange.map((i) => (i === index ? 1 : 0.5)),
        });

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            <Animated.Text style={[styles.tabText, { opacity }]}>
              {typeof label === "function"
                ? label({ focused: isFocused, color: "white", children: "" })
                : label}
            </Animated.Text>
          </TouchableOpacity>
        );
      })}
      <Animated.View style={styles.indicator} />
    </View>
  );
};

export default TopTabBar;
