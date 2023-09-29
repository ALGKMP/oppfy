import { withLayoutContext } from "expo-router";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

const { Navigator } = createBottomTabNavigator();

export const MaterialBottomTabs = withLayoutContext<
  BottomTabNavigationOptions,
  typeof Navigator
>(Navigator);
