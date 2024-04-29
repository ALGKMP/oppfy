import React from "react";
import type { ColorValue, ViewStyle } from "react-native";
import { StackProps, View, XStack } from "tamagui";

interface HeaderProps {
  LeftComponent?: React.ReactNode;
  MiddleComponent?: React.ReactNode;
  RightComponent?: React.ReactNode;
  containerProps?: StackProps;
}

const StackHeader = ({
  LeftComponent,
  MiddleComponent,
  RightComponent,
  containerProps,
}: HeaderProps) => {
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal="$4"
      backgroundColor="$background"
      {...containerProps}
    >
      <View flex={1} alignItems="flex-start">
        {LeftComponent}
      </View>

      <View flex={2} alignItems="center">
        {MiddleComponent}
      </View>

      <View flex={1} alignItems="flex-end">
        {RightComponent}
      </View>
    </XStack>
  );
};

export default StackHeader;
