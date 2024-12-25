import React from "react";
import { Stack, type StackProps } from "tamagui";

import { H5 } from "./Headings";

interface CardContainerProps extends StackProps {
  children: React.ReactNode;
  title?: string;
  orientation?: "vertical" | "horizontal";
}

export const CardContainer = ({
  children,
  title,
  orientation = "vertical",
  ...props
}: CardContainerProps) => {
  return (
    <Stack
      padding="$3"
      borderRadius="$6"
      backgroundColor="$gray2"
      flexDirection={orientation === "horizontal" ? "row" : "column"}
      gap="$3"
      {...props}
    >
      {title && <H5 theme="alt1">{title}</H5>}
      {children}
    </Stack>
  );
};
