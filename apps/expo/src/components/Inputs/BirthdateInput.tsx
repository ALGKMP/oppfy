import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { LayoutChangeEvent, StyleSheet } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { StackProps, Text, TextProps, View, XStack } from "tamagui";

interface BirthdateInputRef {
  focus: () => void;
}

interface BirthdateInputProps {
  value?: string;
  defaultValue?: string;
  onBlur?: () => void;
  onChange?: (value: string) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  onInputLayout?: (event: LayoutChangeEvent) => void;
  containerStyle?: StackProps;
  inputStyle?: StackProps;
  charStyle?: TextProps;
  typedCharStyle?: TextProps;
  untypedCharStyle?: TextProps;
  slashCharStyle?: TextProps;
}

// const BirthdateInput = (props: BirthdateInputProps) => {
const BirthdateInput = forwardRef<BirthdateInputRef, BirthdateInputProps>(
  (props, ref) => {
    const isControlled = props.value !== undefined;
    const [localValue, setLocalValue] = useState(props.defaultValue || "");

    const effectiveValue = isControlled ? props.value ?? "" : localValue;

    const inputRef = useRef<TextInput | null>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    const getDisplayTextComponents = () => {
      const chars = effectiveValue.split("");
      const format = ["D", "D", "/", "M", "M", "/", "Y", "Y", "Y", "Y"];
      let j = 0;
      const result = [];

      for (let i = 0; i < format.length; i++) {
        if (format[i] !== "/") {
          if (chars[j]) {
            result.push(
              <Text key={i} {...props.charStyle} {...props.typedCharStyle}>
                {chars[j]}
              </Text>,
            );
            j++;
          } else {
            result.push(
              <Text key={i} {...props.charStyle} {...props.untypedCharStyle}>
                {format[i]}
              </Text>,
            );
          }
        } else {
          result.push(
            <Text key={i} {...props.charStyle} {...props.slashCharStyle}>
              {format[i]}
            </Text>,
          );
        }
      }

      return result;
    };

    const handleTextChange = (text: string) => {
      const filteredText = text.replace(/\D/g, "");
      if (!isControlled) {
        setLocalValue(filteredText);
      }
      props.onChange && props.onChange(filteredText);
    };

    return (
      <View {...props.containerStyle}>
        <XStack {...props.inputStyle} pointerEvents="none">
          {getDisplayTextComponents()}
        </XStack>

        <TextInput
          ref={inputRef}
          value={effectiveValue}
          onBlur={props.onBlur}
          onLayout={props.onInputLayout}
          onChangeText={handleTextChange}
          style={styles.actualInput}
          keyboardType="number-pad"
          maxLength={8}
          caretHidden
          selection={{
            start: effectiveValue.length,
            end: effectiveValue.length,
          }}
        />
      </View>
    );
  },
);

BirthdateInput.displayName = "BirthdateInput";

const styles = StyleSheet.create({
  actualInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    zIndex: 1,
  },
});

export default BirthdateInput;
