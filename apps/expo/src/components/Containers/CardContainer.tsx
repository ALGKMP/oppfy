import React from "react";
import { View } from "tamagui";

interface CardContainerProps {
  children: React.ReactNode;
}

const CardContainer = ({ children, ...props }: CardContainerProps) => {
  return (
    <View
      paddingVertical="$2"
      paddingHorizontal="$3"
      borderRadius="$6"
      backgroundColor="$gray2"
      {...props}
    >
      {children}
    </View>
  );
};

export default CardContainer;
