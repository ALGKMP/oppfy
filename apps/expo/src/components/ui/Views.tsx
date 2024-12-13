import React from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import type { Edge } from "react-native-safe-area-context";
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

type BaseScreenViewProps = StackProps & {
  children: React.ReactNode;
  keyboardAvoiding?: boolean;
};

type WithSafeArea = BaseScreenViewProps & {
  useSafeArea: true;
  edges?: Edge[];
};

type WithoutSafeArea = BaseScreenViewProps & {
  useSafeArea?: false;
};

type ScreenViewProps = WithSafeArea | WithoutSafeArea;

const defaultStyles = {
  flex: 1,
  paddingHorizontal: "$2",
};

export const ScreenView: React.FC<ScreenViewProps> = ({
  children,
  keyboardAvoiding = false,
  useSafeArea,
  ...props
}) => {
  const theme = useTheme();
  const bgColor = props.backgroundColor
    ? theme[(props.backgroundColor as string).slice(1)]?.val
    : undefined;

  const content = (
    <>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View {...defaultStyles} {...props}>
            {children}
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View {...defaultStyles} {...props}>
          {children}
        </View>
      )}
    </>
  );

  if (!useSafeArea) {
    return content;
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={
        (props as WithSafeArea).edges ?? ["top", "bottom", "left", "right"]
      }
    >
      {content}
    </SafeAreaView>
  );
};
