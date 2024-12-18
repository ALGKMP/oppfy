import { withLayoutContext } from "expo-router";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import type {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from "@react-navigation/material-top-tabs";
import type {
  ParamListBase,
  StackNavigationState,
} from "@react-navigation/native";

const { Navigator } = createMaterialTopTabNavigator();

const TopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export { TopTabs };
