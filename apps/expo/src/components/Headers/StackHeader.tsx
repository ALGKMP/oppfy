import React, { useEffect } from "react";
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
  navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
  options: NativeStackNavigationOptions;
  back?: BackOption;
}

const StackHeader = ({ navigation, options, back }: HeaderProps) => {
  useEffect(() => {
    // console.log("BACK: ", back);
    console.log("NAVIGATION: " + navigation.canGoBack());
  }, [navigation]);

  return (
    <XStack
      padding="$6"
      alignItems="center"
      justifyContent="space-between"
      style={{ backgroundColor: "black" }}
    >
      <View width="$4" alignItems="flex-start">
        {options.headerLeft
          ? options.headerLeft({ canGoBack: navigation.canGoBack() })
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
          options.headerRight({ canGoBack: navigation.canGoBack() })}
      </View>
    </XStack>
  );
};

export default StackHeader;
