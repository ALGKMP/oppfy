import React, { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Button, debounce, Input, Text, View } from "tamagui";
import * as z from "zod";

// Define the schema outside the component
const firstNameSchema = z
  .string()
  .regex(/^[a-zA-Z]+$/)
  .min(2);

const FirstName = () => {
  const router = useRouter();

  const firstNameInputRef = useRef<TextInput>(null);

  const [firstName, setFirstName] = useState("");
  const isValid = firstNameSchema.safeParse(firstName).success;

  const onSubmit = () => {
    router.push({
      params: { firstName },
      pathname: "user-info/date-of-birth",
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View
        flex={1}
        backgroundColor="black"
        padding="$6"
        justifyContent="space-between"
      >
        <View flex={1} space="$8" alignItems="center">
          <Text
            alignSelf="center"
            textAlign="center"
            fontSize={22}
            fontWeight="900"
          >
            What&apos;s your first name?
          </Text>

          <View width="100%" alignItems="center" space="$3">
            <Input
              ref={firstNameInputRef}
              value={firstName}
              onChangeText={setFirstName}
              onLayout={() => firstNameInputRef.current?.focus()}
              textAlign="center"
              backgroundColor="transparent"
              height={50}
              fontSize={36}
              fontWeight="900"
              fontFamily="$mono"
              borderWidth={0}
            />
          </View>
        </View>

        <View>
          <Button
            height="$4"
            borderRadius="$6"
            onPress={onSubmit}
            disabled={!isValid}
            backgroundColor={isValid ? "white" : "gray"}
          >
            <Text
              fontSize={16}
              fontWeight="500"
              color={isValid ? "black" : "lightgray"}
            >
              Next
            </Text>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default FirstName;
