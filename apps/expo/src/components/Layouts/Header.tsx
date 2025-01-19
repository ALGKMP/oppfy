import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, Text, useTheme, View, XStack } from "tamagui";

interface HeaderProps {
  title?: string;
  HeaderLeft?: React.ReactNode;
  HeaderRight?: React.ReactNode;
  HeaderTitle?: React.ReactNode;
  backgroundColor?: string;
  useSafeArea?: boolean;
}

const HEADER_HEIGHT = Platform.OS === "ios" ? 44 : 56;

const Header = ({
  title,
  HeaderLeft,
  HeaderRight,
  HeaderTitle,
  backgroundColor,
  useSafeArea = true,
}: HeaderProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const content =
    HeaderTitle ??
    (title && (
      <Text fontSize="$6" fontWeight="bold">
        {title}
      </Text>
    ));

  return (
    <Stack
      backgroundColor={backgroundColor ?? theme.background.val}
      paddingTop={useSafeArea ? insets.top : "$3"}
    >
      <XStack
        height={HEADER_HEIGHT}
        paddingHorizontal="$4"
        alignItems="center"
        justifyContent="space-between"
      >
        <View flex={1} alignItems="flex-start">
          {HeaderLeft}
        </View>

        <View flex={2} alignItems="center">
          {content}
        </View>

        <View flex={1} alignItems="flex-end">
          {HeaderRight}
        </View>
      </XStack>
    </Stack>
  );
};

export default Header;
