import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import type { StackProps } from "tamagui";
import { Text, useTheme, View, XStack } from "tamagui";

interface HeaderProps {
  title?: string;
  HeaderLeft?: React.ReactNode;
  HeaderRight?: React.ReactNode;
  HeaderTitle?: React.ReactNode;

  containerProps?: StackProps;
}

const StackHeader = ({
  title,
  HeaderLeft,
  HeaderRight,
  HeaderTitle = title ? <DefaultHeaderTitle title={title} /> : null,

  containerProps,
}: HeaderProps) => {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        backgroundColor:
          containerProps?.backgroundColor === "transparent"
            ? "transparent"
            : theme.background.val,
      }}
    >
      <XStack
        // paddingVertical="$2"
        paddingHorizontal="$4"
        alignItems="center"
        justifyContent="space-between"
        backgroundColor="$background"
        {...containerProps}
      >
        <View minWidth="$2" alignItems="flex-start">
          {HeaderLeft}
        </View>

        <View alignItems="center">{HeaderTitle}</View>

        <View minWidth="$2" alignItems="flex-end">
          {HeaderRight}
        </View>
      </XStack>
    </SafeAreaView>
  );
};

interface DefaultHeaderTitleProps {
  title: string;
}

const DefaultHeaderTitle = ({ title }: DefaultHeaderTitleProps) => (
  <Text fontSize="$5" fontWeight="bold">
    {title}
  </Text>
);

export default StackHeader;
