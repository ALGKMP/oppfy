import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Edges } from "react-native-safe-area-context";
import { ScrollView, View, ViewProps } from "tamagui";

interface BaseScreenViewProps extends ViewProps {
  children: React.ReactNode;
  safeAreaEdges?: Edges;
  scrollable?: boolean;
}

const BaseScreenView = ({
  children,
  scrollable,
  safeAreaEdges,
  ...props
}: BaseScreenViewProps) => {
  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}
      edges={safeAreaEdges ?? []}
    >
      <View flex={1} padding="$4" backgroundColor="$background" {...props}>
        {scrollable ? <ScrollView flex={1}>{children}</ScrollView> : children}
      </View>
    </SafeAreaView>
  );
};

export default BaseScreenView;
