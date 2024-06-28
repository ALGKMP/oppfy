import React, { useMemo } from "react";
import type { KeyboardAvoidingViewProps } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { getToken, useTheme } from "tamagui";

interface KeyboardSafeViewProps extends KeyboardAvoidingViewProps {
  children?: React.ReactNode;
}

const KeyboardSafeView = ({ children, ...props }: KeyboardSafeViewProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const verticalOffset = useMemo(() => {
    return (headerHeight - insets.bottom + getToken("$2", "space")) as number;
  }, [headerHeight, insets.bottom]);

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1, backgroundColor: theme.background.val }, props.style]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={verticalOffset}
      {...props}
    >
      {children}
    </KeyboardAvoidingView>
  );
};

export default KeyboardSafeView;
