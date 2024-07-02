import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { InputProps } from "tamagui";
import { Input, useTheme, XStack } from "tamagui";

interface SearchInputProps extends InputProps {
  onClear: () => void;
}

const SearchInput = (props: SearchInputProps) => {
  const theme = useTheme();

  return (
    <XStack
      alignItems="center"
      borderRadius="$4"
      paddingHorizontal="$2.5"
      backgroundColor="$gray2"
    >
      <Ionicons name="search" color={theme.gray7.val} size={24} />
      <Input
        flex={1}
        borderWidth={0}
        backgroundColor="transparent"
        paddingVertical="$3"
        paddingHorizontal="$2"
        {...props}
      />
      {props.value !== "" && (
        <TouchableOpacity onPress={props.onClear}>
          <Ionicons name="close-circle" color={theme.gray7.val} size={24} />
        </TouchableOpacity>
      )}
    </XStack>
  );
};

export default SearchInput;
