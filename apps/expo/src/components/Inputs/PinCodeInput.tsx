// OTPInput.tsx

import React, { ChangeEvent, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface OTPInputProps {
  length?: number;
}

const OTPInput: React.FC<OTPInputProps> = ({ length = 6 }) => {
  const [code, setCode] = useState<string[]>(Array(length).fill(""));
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const inputRef = useRef<TextInput>(null);

  const handleChangeText = (value: string) => {
    const newCode = [...code];
    const valueArr = value.split("");
    for (let i = 0; i < length; i++) {
      newCode[i] = valueArr[i] || "";
    }
    setCode(newCode);
    setActiveIndex(value.length - 1);
  };

  const handlePressBox = (index: number) => {
    setActiveIndex(index);
    inputRef.current?.focus();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      style={styles.container}
    >
      {code.map((num, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.box, index === activeIndex ? styles.activeBox : {}]}
          onPress={() => handlePressBox(index)}
        >
          <Text style={styles.text}>{num}</Text>
        </TouchableOpacity>
      ))}
      <TextInput
        ref={inputRef}
        value={code.join("")}
        onChangeText={handleChangeText}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hiddenInput}
        caretHidden={true}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  box: {
    width: 45,
    height: 45,
    margin: 5,
    borderColor: "gray",
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderWidth: 2,
  },
  activeBox: {
    borderColor: "white",
  },
  text: {
    fontSize: 24,
    color: "white",
    fontWeight: "600",
  },
  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
  },
});

export default OTPInput;
