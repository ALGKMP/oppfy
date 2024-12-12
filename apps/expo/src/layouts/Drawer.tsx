import { withLayoutContext } from "expo-router";
import { createDrawerNavigator } from "@react-navigation/drawer";
import type {
  DrawerNavigationEventMap,
  DrawerNavigationOptions,
} from "@react-navigation/drawer";
import type {
  ParamListBase,
  StackNavigationState,
} from "@react-navigation/native";

const { Navigator } = createDrawerNavigator();

const Drawer = withLayoutContext<
  DrawerNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  DrawerNavigationEventMap
>(Navigator);

export { Drawer };
