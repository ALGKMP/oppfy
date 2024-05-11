import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Edges } from "react-native-safe-area-context";
import type { ViewProps } from "tamagui";
import { View } from "tamagui";

interface BaseScreenViewProps extends ViewProps {
  children: React.ReactNode;
  safeAreaEdges?: Edges;
}

const BaseScreenView = ({ children, ...props }: BaseScreenViewProps) => {
  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}
      edges={props.safeAreaEdges ?? []}
    >
      <View flex={1} padding="$4" backgroundColor="$background" {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
};

export default BaseScreenView;
