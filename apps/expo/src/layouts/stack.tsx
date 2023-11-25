import { withLayoutContext } from "expo-router";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

const NativeStackNavigator = createNativeStackNavigator().Navigator;

export const Stack = withLayoutContext<
  NativeStackNavigationOptions,
  typeof NativeStackNavigator
>(NativeStackNavigator);

export default Stack;
