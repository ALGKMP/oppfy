import React from "react";
import type { ViewProps } from "tamagui";
import { View } from "tamagui";

interface CardContainerProps extends ViewProps {
  children: React.ReactNode;
}

const CardContainer = ({ children, ...props }: CardContainerProps) => {
  return (
    <View padding="$3" borderRadius="$6" backgroundColor="$gray2" {...props}>
      {children}
    </View>
  );
};

export default CardContainer;
