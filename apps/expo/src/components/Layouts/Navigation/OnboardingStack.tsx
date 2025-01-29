import React from "react";
import { Linking } from "react-native";
import { withLayoutContext } from "expo-router";
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
import { useTheme } from "tamagui";

import { Icon } from "~/components/ui";
import { OnboardingHeader } from "../OnboardingHeader";

const { Navigator } = createNativeStackNavigator();

export interface OnboardingStackOptions extends NativeStackNavigationOptions {
  progress?: {
    currentStep: number;
    totalSteps: number;
  };
}

const CustomNavigator = ({
  children,
  ...rest
}: React.ComponentProps<typeof Navigator>) => {
  const theme = useTheme();

  return (
    <Navigator
      {...rest}
      screenOptions={{
        header: ({ navigation, route, options, back }) => {
          const title = getHeaderTitle(options, route.name);

          return (
            <OnboardingHeader
              title={title}
              HeaderLeft={
                options.headerLeft?.({
                  canGoBack: !!back,
                  tintColor: "#fff",
                }) ?? (
                  <DefaultHeaderLeft
                    navigation={navigation}
                    canGoBack={!!back}
                  />
                )
              }
              HeaderRight={
                options.headerRight?.({
                  canGoBack: !!back,
                  tintColor: "#fff",
                }) ?? <DefaultHeaderRight />
              }
              progress={(options as OnboardingStackOptions).progress}
            />
          );
        },
        animation: "fade",
        contentStyle: {
          backgroundColor: theme.primary.val as string,
        },
        headerTintColor: "#fff",
        ...rest.screenOptions,
      }}
    >
      {children}
    </Navigator>
  );
};

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

const DefaultHeaderRight = () => {
  return (
    <Icon
      name="help-circle"
      onPress={() => Linking.openURL("https://oppfy.app")}
      blurred
    />
  );
};

export const OnboardingStack = withLayoutContext<
  OnboardingStackOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(CustomNavigator);
