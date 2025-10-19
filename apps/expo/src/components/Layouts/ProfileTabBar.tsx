import React from "react";
import type {
  MaterialTabBarProps,
  MaterialTabItemProps,
} from "react-native-collapsible-tab-view";
import {
  MaterialTabBar,
  MaterialTabItem,
} from "react-native-collapsible-tab-view";
import { Camera, Grid3x3 } from "@tamagui/lucide-icons";
import { useTheme, XStack } from "tamagui";

const iconMap: Record<
  string,
  React.ComponentType<{ size?: number; color?: string }>
> = {
  Posts: Grid3x3,
  Tagged: Camera,
};

const CustomTabItem = <T extends string>(props: MaterialTabItemProps<T>) => {
  const Icon = iconMap[props.name];

  return (
    <MaterialTabItem
      {...props}
      label={() => (
        <XStack gap="$2" alignItems="center">
          {Icon && <Icon size={20} color="$color" />}
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
        pointerEvents: "box-none",
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
