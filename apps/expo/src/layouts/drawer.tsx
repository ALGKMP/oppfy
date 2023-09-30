import { withLayoutContext } from "expo-router";
import { createDrawerNavigator } from "@react-navigation/drawer";
import type { DrawerNavigationOptions } from "@react-navigation/drawer";

const { Navigator } = createDrawerNavigator();

const Drawer = withLayoutContext<
  DrawerNavigationOptions,
  typeof Navigator
>(Navigator);

export default Drawer;
