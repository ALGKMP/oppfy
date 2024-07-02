import React, { useEffect, useRef } from "react";
import { Animated, Easing, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { InputProps } from "tamagui";
import { Input, useTheme, XStack } from "tamagui";

interface SearchInputProps extends InputProps {
  onClear: () => void;
}

const SearchInput = (props: SearchInputProps) => {
  const theme = useTheme();

  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const animatedScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (props.value !== "") {
      Animated.parallel([
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.spring(animatedScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(animatedOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(animatedScale, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
      ]).start();
    }
  }, [animatedOpacity, animatedScale, props.value]);

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
      <Animated.View
        style={{
          opacity: animatedOpacity,
          transform: [{ scale: animatedScale }],
        }}
      >
        <TouchableOpacity onPress={props.onClear}>
          <Ionicons name="close-circle" color={theme.gray7.val} size={24} />
        </TouchableOpacity>
      </Animated.View>
    </XStack>
  );
};

export default SearchInput;
