import React, { useCallback, useEffect, useMemo, useRef } from "react";
import type { ViewStyle } from "react-native";
import { Animated, Dimensions, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { styled, useTheme, XStack, YStack } from "tamagui";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface NonTamaguiStyles {
  indicator: ViewStyle;
}

const TopTabBar = ({
  state,
  descriptors,
  navigation,
  position,
}: MaterialTopTabBarProps) => {
  const theme = useTheme();
  const tabCount = state.routes.length;
  const indicatorWidth = SCREEN_WIDTH / tabCount;

  const nonTamaguiStyles = useMemo<NonTamaguiStyles>(
    () => createNonTamaguiStyles(),
    [],
  );

  const translateX = useMemo(
    () =>
      position.interpolate({
        inputRange: [0, tabCount - 1],
        outputRange: [0, indicatorWidth * (tabCount - 1)],
        extrapolate: "clamp",
      }),
    [position, tabCount, indicatorWidth],
  );

  // ! Fix for "Sending onAnimatedValueUpdate with no listeners registered"
  // ! occasionally check if this is still needed
  const animatedListenerRef = useRef<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    animatedListenerRef.current = position.addListener(() => {});
    return () => {
      if (animatedListenerRef.current !== null) {
        position.removeListener(animatedListenerRef.current);
      }
    };
  }, [position]);

  const renderTab = useCallback(
    (route: { key: string; name: string }, index: number) => {
      const descriptor = descriptors[route.key];
      if (!descriptor) return null;

      const { options } = descriptor;
      const label = options.tabBarLabel ?? options.title ?? route.name;
      const isFocused = state.index === index;

      const onPress = () => {
        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(route.name);
        }
      };

      const onLongPress = () => {
        navigation.emit({
          type: "tabLongPress",
          target: route.key,
        });
      };

      const opacity = position.interpolate({
        inputRange: [index - 1, index, index + 1],
        outputRange: [0.5, 1, 0.5],
        extrapolate: "clamp",
      });

      return (
        <StyledTabItem
          key={route.key}
          role="button"
          aria-selected={isFocused}
          aria-label={options.tabBarAccessibilityLabel}
          onPress={onPress}
          onLongPress={onLongPress}
        >
          <Animated.Text
            style={{ opacity, color: "white", fontWeight: "bold" }}
          >
            {typeof label === "function"
              ? label({ focused: isFocused, color: "white", children: "" })
              : label}
          </Animated.Text>
        </StyledTabItem>
      );
    },
    [descriptors, navigation, position, state.index],
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ backgroundColor: theme.background.val }}
    >
      <StyledTabBar>
        <XStack flex={1}>{state.routes.map(renderTab)}</XStack>
        <Animated.View
          style={[
            nonTamaguiStyles.indicator,
            {
              width: indicatorWidth,
              transform: [{ translateX }],
            },
          ]}
        />
      </StyledTabBar>
    </SafeAreaView>
  );
};

const StyledTabBar = styled(YStack, {
  height: 50,
  elevation: 5,
});

const StyledTabItem = styled(YStack, {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
});

const createNonTamaguiStyles = (): NonTamaguiStyles =>
  StyleSheet.create({
    indicator: {
      position: "absolute",
      bottom: 0,
      height: 2,
      backgroundColor: "white",
    },
  });

export default TopTabBar;
