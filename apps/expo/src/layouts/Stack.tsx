import React from "react";
import { useRouter, withLayoutContext } from "expo-router";
import { getHeaderTitle } from "@react-navigation/elements";
import type {
  ParamListBase,
  StackNavigationState,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type {
  NativeStackHeaderProps,
  NativeStackNavigationEventMap,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { Text } from "tamagui";

import { Header } from "~/components/Headers";
import { Icon } from "~/components/ui";

const { Navigator } = createNativeStackNavigator();

const DefaultHeaderLeft = ({
  navigation,
  canGoBack,
}: {
  navigation: NativeStackHeaderProps["navigation"];
  canGoBack: boolean;
}) => {
  if (!canGoBack) return null;

  return (
    <Icon name="chevron-back" onPress={() => navigation.goBack()} blurred />
  );
};

const CustomNavigator = ({
  children,
  ...rest
}: React.ComponentProps<typeof Navigator>) => {
  return (
    <Navigator
      {...rest}
      screenOptions={{
        header: ({ navigation, route, options, back }) => {
          const title = getHeaderTitle(options, route.name);

          return (
            <Header
              backgroundColor={
                options.headerTransparent ? "transparent" : undefined
              }
              HeaderLeft={
                options.headerLeft?.({
                  canGoBack: !!back,
                  tintColor: options.headerTintColor,
                }) ?? (
                  <DefaultHeaderLeft
                    navigation={navigation}
                    canGoBack={!!back}
                  />
                )
              }
              HeaderTitle={
                typeof options.headerTitle === "function" ? (
                  options.headerTitle({
                    children: title,
                    tintColor: options.headerTintColor,
                  })
                ) : (
                  <Text fontSize="$5" fontWeight="bold">
                    {title}
                  </Text>
                )
              }
              HeaderRight={options.headerRight?.({
                canGoBack: !!back,
                tintColor: options.headerTintColor,
              })}
            />
          );
        },
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
