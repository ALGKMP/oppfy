import React from "react";
import { ScrollView } from "react-native";
import type { ViewProps } from "tamagui";
import { View } from "tamagui";

interface ScreenBaseViewProps extends ViewProps {
  scrollable?: boolean;
  children: React.ReactNode;
}

const ScreenBaseView = ({
  children,
  scrollable = false,
  ...props
}: ScreenBaseViewProps) => {
  if (scrollable) {
    return (
      <View flex={1} padding="$4" backgroundColor="$background" {...props}>
        <ScrollView style={{ flex: 1 }}>{children}</ScrollView>
      </View>
    );
  }

  return (
    <View flex={1} padding="$4" backgroundColor="$background" {...props}>
      {children}
    </View>
  );
};

export default ScreenBaseView;
