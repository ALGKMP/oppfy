import React from "react";
import * as Haptics from "expo-haptics";
import { useRouter, withLayoutContext } from "expo-router";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type {
  BottomTabNavigationEventMap,
  BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import type {
  ParamListBase,
  StackNavigationState,
} from "@react-navigation/native";
import { Text } from "tamagui";

import { Icon } from "~/components/ui";
import BottomTabBar from "../BottomTabBar";
import Header from "../Header";

const { Navigator } = createBottomTabNavigator();

const DefaultHeaderLeft = ({ canGoBack }: { canGoBack?: boolean }) => {
  const router = useRouter();

  if (!canGoBack) return null;

  return <Icon name="chevron-back" onPress={() => router.back()} blurred />;
};

const CustomNavigator = ({
  children,
  ...rest
}: React.ComponentProps<typeof Navigator>) => {
  return (
    <Navigator
      {...rest}
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        header: ({ navigation, route, options }) => (
          <Header
            backgroundColor={
              options.headerTransparent ? "transparent" : undefined
            }
            HeaderLeft={
              options.headerLeft?.({
                canGoBack: navigation.canGoBack(),
                tintColor: options.headerTintColor,
              }) ?? <DefaultHeaderLeft canGoBack={navigation.canGoBack()} />
            }
            HeaderTitle={
              typeof options.headerTitle === "function" ? (
                options.headerTitle({
                  children: options.title ?? "",
                  tintColor: options.headerTintColor,
                })
              ) : (
                <Text fontSize="$5" fontWeight="bold">
                  {options.title ?? route.name}
                </Text>
              )
            }
            HeaderRight={options.headerRight?.({
              canGoBack: navigation.canGoBack(),
              tintColor: options.headerTintColor,
            })}
          />
        ),
        ...rest.screenOptions,
      }}
      screenListeners={{
        tabPress: () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        ...rest.screenListeners,
      }}
    >
      {children}
    </Navigator>
  );
};

const BottomTabs = withLayoutContext<
  BottomTabNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  BottomTabNavigationEventMap
>(CustomNavigator);

export { BottomTabs };
