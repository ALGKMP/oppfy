import { withLayoutContext } from "expo-router";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type {
  BottomTabNavigationEventMap,
  BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import type {
  ParamListBase,
  StackNavigationState,
} from "@react-navigation/native";

const { Navigator } = createBottomTabNavigator();

const BottomTabs = withLayoutContext<
  BottomTabNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  BottomTabNavigationEventMap
>(Navigator);

export default BottomTabs;
