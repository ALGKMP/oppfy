import { withLayoutContext } from "expo-router";
import { createStackNavigator } from "@react-navigation/stack";
import type { StackNavigationOptions } from "@react-navigation/stack";

const { Navigator } = createStackNavigator();

export const Stack = withLayoutContext<
  StackNavigationOptions,
  typeof Navigator
>(Navigator);
