import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet, TextInput, TouchableOpacity } from "react-native";
import type { LayoutChangeEvent, TouchableOpacityProps } from "react-native";
import { Text } from "tamagui";
import type { TextProps } from "tamagui";

interface PinCodeInputRef {
  focus: () => void;
}

interface OTPInputProps {
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  value?: string;
  defaultValue?: string;
  length: number;
  containerStyle?: TouchableOpacityProps["style"];
  pinInputStyle?: TouchableOpacityProps["style"];
  activePinInputStyle?: TouchableOpacityProps["style"];
  textStyle?: TextProps;
}

const PinCodeInput = forwardRef<PinCodeInputRef, OTPInputProps>(
  (props, ref) => {
    const isControlled = props.value !== undefined;
    const [localValue, setLocalValue] = useState(props.defaultValue ?? "");

    const effectiveValue = isControlled ? props.value ?? "" : localValue;

    const codeArr = [...effectiveValue]
      .concat(Array(props.length).fill(""))
      .slice(0, props.length);

    const [activeIndex, setActiveIndex] = useState<number>(0);
    const inputRef = useRef<TextInput | null>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    const handleChangeText = (value: string) => {
      const newCode = value.slice(0, props.length);

      if (!isControlled) {
        setLocalValue(newCode);
      }

      setActiveIndex(value.length - 1);
      props.onChange && props.onChange(newCode);
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
        {codeArr.map((num, index) => (
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
          value={effectiveValue}
          onChangeText={handleChangeText}
          onLayout={props.onLayout}
          onBlur={props.onBlur}
          keyboardType="number-pad"
          maxLength={props.length}
          style={styles.hiddenInput}
          caretHidden={true}
          selection={{
            start: effectiveValue.length,
            end: effectiveValue.length,
          }}
        />
      </TouchableOpacity>
    );
  },
);

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
