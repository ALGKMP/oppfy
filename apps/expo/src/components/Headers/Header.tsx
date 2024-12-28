import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { StackProps, ViewProps } from "tamagui";
import { styled, Text, useTheme, View, XStack } from "tamagui";

interface HeaderProps {
  title?: string;
  HeaderLeft?: React.ReactNode;
  HeaderRight?: React.ReactNode;
  HeaderTitle?: React.ReactNode | string;
  containerProps?: StackProps;
  safeArea?: boolean;
}

const HEADER_HEIGHT = Platform.OS === "ios" ? 44 : 56;

const StackHeader = ({
  title,
  HeaderLeft,
  HeaderRight,
  HeaderTitle = title ? <DefaultHeaderTitle title={title} /> : null,
  containerProps,
  safeArea = true,
}: HeaderProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const containerStyle = useMemo<ViewProps>(
    () => ({
      paddingTop: safeArea ? insets.top : "$2",
      backgroundColor:
        containerProps?.backgroundColor === "transparent"
          ? "transparent"
          : theme.background.val,
    }),
    [insets.top, containerProps?.backgroundColor, theme.background.val],
  );

  return (
    <View {...containerStyle}>
      <HeaderContainer {...containerProps}>
        <SideContainer alignItems="flex-start">{HeaderLeft}</SideContainer>
        <View alignItems="center">{HeaderTitle}</View>
        <SideContainer alignItems="flex-end">{HeaderRight}</SideContainer>
      </HeaderContainer>
    </View>
  );
};

interface DefaultHeaderTitleProps {
  title: string;
}

const DefaultHeaderTitle = ({ title }: DefaultHeaderTitleProps) => (
  <StyledHeaderTitle>{title}</StyledHeaderTitle>
);

const HeaderContainer = styled(XStack, {
  height: HEADER_HEIGHT,
  paddingHorizontal: "$4",
  alignItems: "center",
  justifyContent: "space-between",
});

const SideContainer = styled(View, {
  minWidth: "$2",
});

const StyledHeaderTitle = styled(Text, {
  fontSize: "$6",
  fontWeight: "bold",
});

export default React.memo(StackHeader);
