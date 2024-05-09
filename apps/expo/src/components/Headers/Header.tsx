import React from "react";
import type { StackProps } from "tamagui";
import { Text, View, XStack } from "tamagui";

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
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      height="$4"
      paddingHorizontal="$4"
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
