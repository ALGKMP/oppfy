import React from "react";
import type { KeyboardAvoidingViewProps } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useTheme } from "tamagui";

interface KeyboardSafeViewProps extends KeyboardAvoidingViewProps {
  children?: React.ReactNode;
}

const KeyboardSafeView = ({ children, ...props }: KeyboardSafeViewProps) => {
  const theme = useTheme();

  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const verticalOffset = React.useMemo(
    () => headerHeight + insets.top,
    [headerHeight, insets.top],
  );

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1, backgroundColor: theme.background.val }, props.style]} // Merge style from props with default style
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={verticalOffset}
      {...props} // Spread the rest of the props to the KeyboardAvoidingView
    >
      {children}
    </KeyboardAvoidingView>
  );
};

export default KeyboardSafeView;
