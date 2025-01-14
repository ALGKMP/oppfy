import React from "react";
import { useRouter, withLayoutContext } from "expo-router";
import type {
  ParamListBase,
  StackNavigationState,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type {
  NativeStackNavigationEventMap,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { Text } from "tamagui";

import { Header } from "~/components/Headers";
import { Icon } from "~/components/ui";

const { Navigator } = createNativeStackNavigator();

const DefaultHeaderLeft = ({ canGoBack }: { canGoBack?: boolean }) => {
  const router = useRouter();

  if (!canGoBack) return null;

  return <Icon name="chevron-back" onPress={() => router.back()} blurred />;
};

const CustomNavigator = ({ children, ...rest }: any) => {
  return (
    <Navigator
      {...rest}
      screenOptions={{
        header: ({ navigation, route, options }) => (
          <Header
            containerProps={{
              backgroundColor: options.headerTransparent
                ? "transparent"
                : undefined,
            }}
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
    >
      {children}
    </Navigator>
  );
};

const Stack = withLayoutContext<
  NativeStackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(CustomNavigator);

export { Stack };
