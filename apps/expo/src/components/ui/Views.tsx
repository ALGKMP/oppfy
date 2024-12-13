import React from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import {
  SafeAreaView as RNSafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import type { Edge } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import {
  styled,
  ScrollView as TamaguiScrollView,
  View as TamaguiView,
  useTheme,
  type StackProps,
} from "tamagui";

export const View = styled(TamaguiView, {});
export const ScrollView = styled(TamaguiScrollView, {});

export const SafeAreaView = styled(RNSafeAreaView, {});

type ScreenViewProps = StackProps & {
  children: React.ReactNode;
  safeAreaEdges?: Edge[];
  keyboardAvoiding?: boolean;
};

const defaultStyles = {
  flex: 1,
  padding: "$2",
};

export const ScreenView: React.FC<ScreenViewProps> = ({
  children,
  keyboardAvoiding = false,
  safeAreaEdges,
  ...props
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const bgColor = props.backgroundColor
    ? theme[(props.backgroundColor as string).slice(1)]?.val
    : undefined;

  const keyboardOffset = Platform.select({
    ios: insets.bottom + headerHeight + 68,
    android: insets.bottom + headerHeight + 68,
  });

  const content = (
    <View {...defaultStyles} {...props}>
      {children}
    </View>
  );

  const wrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={{ flex: 1, width: "100%" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardOffset}
      enabled
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  if (!safeAreaEdges) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        {wrappedContent}
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={safeAreaEdges}
    >
      {wrappedContent}
    </SafeAreaView>
  );
};
