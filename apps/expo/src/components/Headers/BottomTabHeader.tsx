import React from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
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

interface HeaderProps {
  navigation: BottomTabNavigationProp<ParamListBase, string, undefined>;
  options: BottomTabNavigationOptions;
  back?: BackOption;
}

const BottomTabHeader = ({ navigation, options, back }: HeaderProps) => {
  return (
    <XStack
      padding="$6"
      alignItems="center"
      justifyContent="space-between"
      style={{ backgroundColor: "black" }}
    >
      <View width="$4" alignItems="flex-start">
        {options.headerLeft
          ? options.headerLeft({
              tintColor: options.headerTintColor,
              pressColor: options.headerPressColor,
              pressOpacity: options.headerPressOpacity,
              labelVisible: options.headerLeftLabelVisible,
            })
          : back && (
              <ChevronLeft size="$1.5" onPress={() => navigation.goBack()} />
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
          options.headerRight({
            tintColor: options.headerTintColor,
            pressColor: options.headerPressColor,
            pressOpacity: options.headerPressOpacity,
          })}
      </View>
    </XStack>
  );
};

export default BottomTabHeader;
