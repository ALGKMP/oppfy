import React from "react";
import { TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  BottomTabNavigationOptions,
  BottomTabNavigationProp,
} from "@react-navigation/bottom-tabs";
import type {
  NativeStackNavigationOptions,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import type { ParamListBase } from "@react-navigation/routers";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { Text, View, XStack } from "tamagui";

interface BackOption {
  title: string;
}

type Options = NativeStackNavigationOptions | BottomTabNavigationOptions;

type Navigation =
  | NativeStackNavigationProp<ParamListBase, string, undefined>
  | BottomTabNavigationProp<ParamListBase, string, undefined>;

interface HeaderProps {
  back?: BackOption;
  options: Options;
  navigation: Navigation;
}

const StackHeader = ({ navigation, options, back }: HeaderProps) => {
  return (
    <XStack
      paddingBottom="$4"
      paddingHorizontal="$6"
      backgroundColor="black"
      alignItems="center"
      justifyContent="space-between"
    >
      <View width="$4" alignItems="flex-start">
        {options.headerLeft
          ? options.headerLeft({ canGoBack: navigation.canGoBack() })
          : back && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeft size="$1.5" />
              </TouchableOpacity>
            )}
      </View>

      <View>
        {typeof options.headerTitle === "function" ? (
          options.headerTitle({
            children: options.title ?? "",
            tintColor: options.headerTintColor,
          })
        ) : options.title ? (
          <Text fontSize={16} fontWeight="600">
            {options.title}
          </Text>
        ) : null}
      </View>

      <View width="$4" alignItems="flex-end">
        {options.headerRight &&
          options.headerRight({ canGoBack: navigation.canGoBack() })}
      </View>
    </XStack>
  );
};

export default StackHeader;
