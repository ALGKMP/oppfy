import React from "react";
import { Minus } from "@tamagui/lucide-icons";
import { SizableText, View, YStack } from "tamagui";

interface BottomSheetHeaderProps {
  title: string;
}

const BottomSheetHeader = ({ title }: BottomSheetHeaderProps) => (
  <YStack
    flex={1}
    justifyContent="center"
    alignItems="center"
    position="relative"
  >
    <Minus size="$4" />
    <View justifyContent="center" alignItems="center">
      <SizableText
        size="$5"
        textAlign="center"
        color="$white"
        fontWeight="bold"
      >
        {title}
      </SizableText>
    </View>
    <View width="95%" borderColor="$gray8" borderWidth="$0.25" marginTop="$3" />
  </YStack>
);

export default BottomSheetHeader;
