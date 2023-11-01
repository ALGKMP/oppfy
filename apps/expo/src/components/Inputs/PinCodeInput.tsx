import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet, TextInput, TouchableOpacity } from "react-native";
import type { TouchableOpacityProps } from "react-native";
import { Text } from "tamagui";
import type { TextProps } from "tamagui";

interface PinCodeInput {
  focus: () => void;
}

interface OTPInputProps {
  onChange?: (value: string) => void;
  onBlur?: () => void;
  value?: string;
  length: number;
  containerStyle?: TouchableOpacityProps["style"];
  pinInputStyle?: TouchableOpacityProps["style"];
  activePinInputStyle?: TouchableOpacityProps["style"];
  textStyle?: TextProps;
}

const PinCodeInput = forwardRef<PinCodeInput, OTPInputProps>((props, ref) => {
  const [code, setCode] = useState<string[]>(Array(props.length).fill(""));
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const inputRef = useRef<TextInput | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  const handleChangeText = (value: string) => {
    const newCode = [...code];
    const valueArr = value.split("");
    for (let i = 0; i < props.length; i++) {
      newCode[i] = valueArr[i] ?? "";
    }
    setCode(newCode);
    setActiveIndex(value.length - 1);

    props.onChange && props.onChange(value);
  };

  const handlePressBox = (index: number) => {
    setActiveIndex(index);
    inputRef.current?.focus();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      style={props.containerStyle}
    >
      {code.map((num, index) => (
        <TouchableOpacity
          key={index}
          style={[
            props.pinInputStyle,
            index === activeIndex ? props.activePinInputStyle : {},
          ]}
          onPress={() => handlePressBox(index)}
        >
          <Text {...props.textStyle}>{num}</Text>
        </TouchableOpacity>
      ))}
      <TextInput
        ref={inputRef}
        value={props.value}
        onChangeText={handleChangeText}
        onBlur={props.onBlur}
        keyboardType="number-pad"
        maxLength={props.length}
        style={styles.hiddenInput}
        caretHidden={true}
      />
    </TouchableOpacity>
  );
});

PinCodeInput.displayName = "PinCodeInput";

const styles = StyleSheet.create({
  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
  },
});

export default PinCodeInput;
