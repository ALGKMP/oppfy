import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Edge } from "react-native-safe-area-context";
import type { ViewProps } from "tamagui";
import { ScrollView, View } from "tamagui";

interface BaseScreenViewProps extends ViewProps {
  children: React.ReactNode;
  safeAreaEdges?: Edge[];
  scrollable?: boolean;
  topSafeAreaStyle?: StyleProp<ViewStyle>;
  bottomSafeAreaStyle?: StyleProp<ViewStyle>;
}

const BaseScreenView = ({
  children,
  scrollable,
  safeAreaEdges,
  topSafeAreaStyle,
  bottomSafeAreaStyle,
  ...props
}: BaseScreenViewProps) => {
  const renderTopSafeArea = () => {
    if (topSafeAreaStyle ?? safeAreaEdges?.includes("top")) {
      return (
        <SafeAreaView
          style={[styles.topSafeArea, topSafeAreaStyle]}
          edges={safeAreaEdges?.includes("top") ? ["top"] : undefined}
        />
      );
    }
    return null;
  };

  const renderBottomSafeArea = () => {
    if (bottomSafeAreaStyle ?? safeAreaEdges?.includes("bottom")) {
      return (
        <SafeAreaView
          style={[styles.bottomSafeArea, bottomSafeAreaStyle]}
          edges={safeAreaEdges?.includes("bottom") ? ["bottom"] : undefined}
        >
          <View flex={1} padding="$4" backgroundColor="$background" {...props}>
            {scrollable ? (
              <ScrollView flex={1}>{children}</ScrollView>
            ) : (
              children
            )}
          </View>
        </SafeAreaView>
      );
    }
    return (
      <View flex={1} padding="$4" backgroundColor="$background" {...props}>
        {scrollable ? <ScrollView flex={1}>{children}</ScrollView> : children}
      </View>
    );
  };

  return (
    <>
      {renderTopSafeArea()}
      {renderBottomSafeArea()}
    </>
  );
};

const styles = StyleSheet.create({
  topSafeArea: {
    flex: 0,
  },
  bottomSafeArea: {
    flex: 1,
  },
});

export default BaseScreenView;
