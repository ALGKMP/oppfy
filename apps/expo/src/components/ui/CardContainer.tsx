import React from "react";
import type { YStackProps } from "tamagui";

import { H5 } from "./Headings";
import { Separator } from "./Separator";
import { YStack } from "./Stacks";

interface CardContainerProps extends YStackProps {
  children: React.ReactNode;
  title?: string;
}

export const CardContainer = ({
  children,
  title,
  ...props
}: CardContainerProps) => {
  return (
    <YStack
      padding="$3"
      borderRadius="$6"
      backgroundColor="$gray2"
      gap="$3"
      {...props}
    >
      {title && <H5 theme="alt1">{title}</H5>}
      {children}
    </YStack>
  );
};
