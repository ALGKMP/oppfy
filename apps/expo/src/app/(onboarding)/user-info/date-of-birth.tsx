import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Button, Text, View, YStack } from "tamagui";
import * as z from "zod";

import { api } from "~/utils/api";
import { BirthdateInput } from "~/components/Inputs";
import useParams from "~/hooks/useParams";

interface UserDetailsFlowParams {
  firstName: string;
  [Key: string]: string;
}

// Define your schema for validation
const dateOfBirthSchema = z.object({
  dateOfBirth: z.string(),
});

const DateOfBirth = () => {
  const router = useRouter();

  const userDetailsFlowParams = useParams<UserDetailsFlowParams>();

  const dateOfBirthInputRef = useRef<TextInput | null>(null);

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isValid, setIsValid] = useState(false);

  const updateUserDetails = api.auth.updateUserDetails.useMutation();

  const onSubmit = async () => {
    await updateUserDetails.mutateAsync({
      ...userDetailsFlowParams,
      dateOfBirth,
    });

    router.replace("/profile");
  };

  // Use useEffect to update the validation state
  useEffect(() => {
    setIsValid(dateOfBirthSchema.safeParse({ dateOfBirth }).success);
  }, [dateOfBirth]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View
        flex={1}
        backgroundColor="$backgroundStrong"
        padding="$6"
        justifyContent="space-between"
      >
        <YStack flex={1} space="$8" alignItems="center">
          <Text
            alignSelf="center"
            textAlign="center"
            fontSize={22}
            fontWeight="900"
          >
            When's your birthday?
          </Text>

          <YStack width="100%" alignItems="center" space="$3">
            <BirthdateInput
              ref={dateOfBirthInputRef}
              value={dateOfBirth}
              onBlur={() => {}}
              onChange={(value) => setDateOfBirth(value)}
              onLayout={() => dateOfBirthInputRef.current?.focus()}
              containerStyle={{
                position: "relative",
                alignItems: "center",
                height: 50,
              }}
              inputStyle={{}}
              charStyle={{
                fontFamily: "$monospace",
                textAlign: "center",
                fontSize: 36,
                fontWeight: "900",
              }}
              typedCharStyle={{}}
              untypedCharStyle={{
                color: "$gray6",
              }}
              slashCharStyle={{
                color: "$gray6",
              }}
            />
          </YStack>
        </YStack>

        <View>
          <Button
            animation="100ms"
            pressStyle={{
              scale: 0.95,
              backgroundColor: "white",
            }}
            onPress={onSubmit}
            height="$4"
            borderRadius="$6"
            backgroundColor={isValid ? "white" : "gray"}
            disabled={!isValid}
          >
            <Text
              color={isValid ? "black" : "lightgray"}
              fontWeight="500"
              fontSize={16}
            >
              Next
            </Text>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default DateOfBirth;
