import React from "react";
import { Animated } from "react-native";
import type {
  MaterialTabBarProps,
  MaterialTabItemProps,
} from "react-native-collapsible-tab-view";
import {
  MaterialTabBar,
  MaterialTabItem,
} from "react-native-collapsible-tab-view";
import { Grid3x3, UserCheck } from "@tamagui/lucide-icons";
import { useTheme, XStack } from "tamagui";

const iconMap: Record<
  string,
  React.ComponentType<{ size?: number; color?: string }>
> = {
  Posts: Grid3x3,
  Tagged: UserCheck,
};

const CustomTabItem = <T extends string>(props: MaterialTabItemProps<T>) => {
  const theme = useTheme();
  const Icon = iconMap[props.name];

  return (
    <MaterialTabItem
      {...props}
      label={() => (
        <XStack gap="$2" alignItems="center">
          {Icon && <Icon size={20} color={theme.color.val} />}
          <Animated.Text
            style={{
              color: theme.color.val,
              fontSize: 14,
            }}
          >
            {props.name}
          </Animated.Text>
        </XStack>
      )}
    />
  );
};

export const ProfileTabBar = (props: MaterialTabBarProps<string>) => {
  const theme = useTheme();

  return (
    <MaterialTabBar
      {...props}
      TabItemComponent={CustomTabItem}
      activeColor={theme.color.val}
      inactiveColor={theme.color.val}
      indicatorStyle={{
        backgroundColor: theme.color.val,
        height: 1,
      }}
      style={{
        backgroundColor: theme.background.val,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.gray4?.val ?? "rgba(255, 255, 255, 0.1)",
      }}
      tabStyle={{
        height: 48,
      }}
      labelStyle={{
        fontSize: 0,
        height: 0,
        margin: 0,
      }}
    />
  );
};
