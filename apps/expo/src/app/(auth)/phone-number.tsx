import React, { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import type { TextInput } from "react-native";
import { Link, useRouter } from "expo-router";
import { isValidNumber } from "libphonenumber-js";
import { Controller, set, useForm } from "react-hook-form";
import {
  Button,
  Checkbox,
  H1,
  H2,
  H5,
  Input,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";
import * as z from "zod";

import { api } from "~/utils/api";
import { PhoneNumberInput, UnderlineInput } from "~/components/Inputs";
import QuickList from "~/components/QuickList";
import withShake from "~/components/withShake";
import { groupedCountries } from "~/data/groupedCountries";
import PhoneNumberOTP from "./pin-code-otp";

interface FormData {
  phoneNumber: string;
  isValid: boolean;
  error: string | null;
}

const PhoneNumber = () => {
  const router = useRouter();

  const inputRef = useRef<TextInput | null>(null);

  const [formState, setFormState] = useState<FormData>({
    phoneNumber: "",
    isValid: false,
    error: null,
  });

  const setFormStateFn = useCallback(
    (newState: Partial<FormData>) =>
      setFormState((prevState) => ({ ...prevState, ...newState })),
    [],
  );

  const onSubmit = ({ phoneNumber }: FormData) => {
    router.push({ params: { phoneNumber }, pathname: "pin-code-otp" });
  };

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
            What's your phone number?
          </Text>

          <YStack space="$3">
            <PhoneNumberInput
              ref={inputRef}
              onInputLayout={() => inputRef.current?.focus()}
              onChange={({ dialingCode, phoneNumber }) => {
                const isValid = isValidNumber(`${dialingCode}${phoneNumber}`);

                setFormStateFn({
                  phoneNumber: `${dialingCode}${phoneNumber}`,
                  isValid,
                  error: isValid ? null : "Invalid phone number",
                });
              }}
              modalContainerStyle={{
                flex: 1,
                backgroundColor: "$backgroundStrong",
              }}
              inputsContainerStyle={{
                width: "100%",
                alignItems: "center",
              }}
              dialingCodeButtonStyle={{
                backgroundColor: "transparent",
                borderColor: "$gray7",
                borderWidth: 2,
                borderRadius: 12,
                height: 50,
                width: 70,
              }}
              dialingCodeTextStyle={{
                fontSize: 22,
              }}
              phoneNumberInputStyle={{
                flex: 1,
                borderWidth: 0,
                fontSize: 32,
                fontFamily: "$mono",
                fontWeight: "900",
                backgroundColor: "transparent",
              }}
            />
          </YStack>

          <Text
            textAlign="center"
            fontSize={14}
            fontWeight="700"
            color="$gray11"
          >
            {[
              "By continuing, you agree to our ",
              <Link key="privacy-policy" href="">
                <Text color="$gray10">Privacy Policy</Text>
              </Link>,
              " and ",
              <Link key="terms-of-service" href="">
                <Text color="$gray10">Terms of Service.</Text>
              </Link>,
            ]}
          </Text>
        </YStack>

        <View alignSelf="stretch" marginTop="auto">
          <Button
            animation="100ms"
            pressStyle={{
              scale: 0.95,
              backgroundColor: "white",
            }}
            onPress={() => onSubmit(formState)}
            height="$4"
            borderRadius="$6"
            backgroundColor={formState.isValid ? "white" : "gray"}
            disabled={!formState.isValid}
          >
            <Text
              color={formState.isValid ? "black" : "lightgray"}
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

export default PhoneNumber;
