import React from "react";
import { withLayoutContext } from "expo-router";
import type {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from "@react-navigation/material-top-tabs";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import type {
  ParamListBase,
  StackNavigationState,
} from "@react-navigation/native";

import { TopTabBar } from "~/components/TabBars";

const { Navigator } = createMaterialTopTabNavigator();

const CustomNavigator = ({
  children,
  ...rest
}: React.ComponentProps<typeof Navigator>) => {
  return (
    <Navigator
      {...rest}
      tabBar={(props) => <TopTabBar {...props} />}
      screenOptions={{
        ...rest.screenOptions,
      }}
    >
      {children}
    </Navigator>
  );
};

const TopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(CustomNavigator);

export { TopTabs };
