import React from "react";
import type { OpaqueColorValue, TextInput } from "react-native";
import { Input } from "tamagui";
import type { ColorTokens, InputProps, SizeTokens } from "tamagui";

import type { OmitPropsStartingWith } from "@acme/types";

interface UnderlineInputProps
  extends OmitPropsStartingWith<InputProps, "border"> {
  underlineColor?: ColorTokens | OpaqueColorValue;
  underlineWidth?: SizeTokens;
  children?: React.ReactNode;
}

const UnderlineInput = React.forwardRef<TextInput, UnderlineInputProps>(
  (
    { underlineColor = "black", underlineWidth = 2, children, ...props },
    ref,
  ) => {
    return (
      <Input
        ref={ref}
        padding={0}
        borderTopWidth={0}
        borderLeftWidth={0}
        borderRightWidth={0}
        borderTopLeftRadius={0}
        borderTopRightRadius={0}
        borderBottomLeftRadius={0}
        borderBottomRightRadius={0}
        backgroundColor="transparent"
        borderBottomWidth={underlineWidth}
        borderBottomColor={underlineColor}
        {...props}
      >
        {children}
      </Input>
    );
  },
);

UnderlineInput.displayName = "UnderlineInput";

export default UnderlineInput;
