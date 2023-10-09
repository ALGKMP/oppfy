import React from "react";
import { TextInput } from "react-native";
import { Input } from "tamagui";
import type { InputProps, SizeTokens } from "tamagui";

type OmittedProps =
  | "borderTopWidth"
  | "borderLeftWidth"
  | "borderRightWidth"
  | "borderTopLeftRadius"
  | "borderTopRightRadius"
  | "borderBottomLeftRadius"
  | "borderBottomRightRadius"
  | "borderBlockColor"
  | "borderBlockEndColor"
  | "borderBlockStartColor"
  | "borderBottomEndRadius"
  | "borderBottomColor"
  | "borderBottomWidth"
  | "borderBottomStartRadius"
  | "borderColor"
  | "borderCurve"
  | "borderEndColor"
  | "borderEndEndRadius"
  | "borderEndStartRadius"
  | "borderEndWidth"
  | "borderLeftColor"
  | "borderRadius"
  | "borderRightColor"
  | "borderStartColor"
  | "borderStartEndRadius"
  | "borderStartStartRadius"
  | "borderStartWidth"
  | "borderStyle"
  | "borderTopColor"
  | "borderTopEndRadius"
  | "borderTopStartRadius"
  | "borderWidth";

interface UnderlineInputProps extends Omit<InputProps, OmittedProps> {
  underlineColor?: string;
  underlineWidth?: SizeTokens;
  children?: React.ReactNode;
}

const UnderlineInput = React.forwardRef<Input, UnderlineInputProps>(
  ({ underlineColor = "black", underlineWidth = 2, children, ...props }, ref) => {
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
      borderBottomWidth={underlineWidth}
      borderBottomColor={underlineColor}
      {...props}
    >
      {children}
    </Input>
  );
});

UnderlineInput.displayName = "UnderlineInput"; // Useful for debugging

export default UnderlineInput;
