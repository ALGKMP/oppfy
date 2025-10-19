import React, { memo } from "react";
import { View } from "react-native";
import type {
  MaterialTabBarProps,
  MaterialTabItemProps,
} from "react-native-collapsible-tab-view";
import {
  MaterialTabBar,
  MaterialTabItem,
} from "react-native-collapsible-tab-view";
import { Camera, Grid3x3 } from "@tamagui/lucide-icons";

const postsLabel = () => (
  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
    <Grid3x3 size={20} color="#FFFFFF" />
  </View>
);

const taggedLabel = () => (
  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
    <Camera size={20} color="#FFFFFF" />
  </View>
);

const CustomTabItem = <T extends string>(props: MaterialTabItemProps<T>) => {
  const label = props.name === "Posts" ? postsLabel : taggedLabel;
  return <MaterialTabItem {...props} label={label} />;
};

const indicatorStyle = {
  backgroundColor: "#FFFFFF",
  height: 2,
  borderRadius: 1,
};

const tabBarStyle = {
  backgroundColor: "#151515",
  elevation: 0,
  shadowOpacity: 0,
  borderBottomWidth: 0.5,
  borderBottomColor: "rgba(0, 0, 0, 0.1)",
  // pointerEvents: "box-none" as const,
};

const tabStyle = {
  height: 48,
};

const labelStyle = {
  fontSize: 0,
  height: 0,
  margin: 0,
};

export const ProfileTabBar = (props: MaterialTabBarProps<string>) => {
  return (
    <MaterialTabBar
      {...props}
      TabItemComponent={CustomTabItem}
      activeColor="#FFFFFF"
      inactiveColor="#FFFFFF"
      indicatorStyle={indicatorStyle}
      style={tabBarStyle}
      tabStyle={tabStyle}
      labelStyle={labelStyle}
    />
  );
};
