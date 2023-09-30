import { withLayoutContext } from "expo-router";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

const { Navigator } = createBottomTabNavigator();

const BottomTabs = withLayoutContext<
  BottomTabNavigationOptions,
  typeof Navigator
>(Navigator);

export default BottomTabs;