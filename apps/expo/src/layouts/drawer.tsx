import { withLayoutContext } from "expo-router";
import { createDrawerNavigator } from "@react-navigation/drawer";
import type { DrawerNavigationOptions } from "@react-navigation/drawer";

const { Navigator } = createDrawerNavigator();

export const Drawer = withLayoutContext<
  DrawerNavigationOptions,
  typeof Navigator
>(Navigator);
