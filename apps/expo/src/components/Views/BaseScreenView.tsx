import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Edge } from "react-native-safe-area-context";
import type { ScrollViewProps, ViewProps } from "tamagui";
import { ScrollView, View } from "tamagui";

type BaseScreenViewProps =
  | ({
      scrollable: true;
    } & ScrollViewProps)
  | ({
      scrollable?: false;
    } & ViewProps);

interface CommonProps {
  children: React.ReactNode;
  safeAreaEdges?: Edge[];
  topSafeAreaStyle?: StyleProp<ViewStyle>;
  bottomSafeAreaStyle?: StyleProp<ViewStyle>;
}

const BaseScreenView = ({
  children,
  safeAreaEdges,
  topSafeAreaStyle,
  bottomSafeAreaStyle,
  scrollable,
  ...props
}: CommonProps & BaseScreenViewProps) => {
  const renderContent = () =>
    scrollable ? (
      <ScrollView
        flex={1}
        padding="$4"
        backgroundColor="$background"
        {...(props as ScrollViewProps)}
      >
        {children}
      </ScrollView>
    ) : (
      <View
        flex={1}
        padding="$4"
        backgroundColor="$background"
        {...(props as ViewProps)}
      >
        {children}
      </View>
    );

  const renderTopSafeArea = () => {
    if (!safeAreaEdges?.includes("top")) {
      return null;
    }

    return (
      <SafeAreaView
        style={[styles.topSafeArea, topSafeAreaStyle]}
        edges={safeAreaEdges?.includes("top") ? ["top"] : undefined}
      />
    );
  };

  const renderBottomSafeArea = () => {
    if (!safeAreaEdges?.includes("bottom")) {
      return renderContent();
    }

    return (
      <SafeAreaView
        style={[styles.bottomSafeArea, bottomSafeAreaStyle]}
        edges={safeAreaEdges?.includes("bottom") ? ["bottom"] : undefined}
      >
        {renderContent()}
      </SafeAreaView>
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
