import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  SectionList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Link, Stack, useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "@tamagui/lucide-icons";
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
import PhoneNumberOTP from "./phone-number-otp";

type FormData = z.infer<typeof schemaValidation>;

const schemaValidation = z.object({
  phoneNumber: z
    .string()
    .min(1, { message: "Invalid number" })
    .refine((phoneNumber) => isValidNumber(phoneNumber), {
      message: "Invalid phone number format",
      path: ["phoneNumber"],
    }),
});

const ShakingUnderlineInput = withShake(UnderlineInput);

const PhoneNumber = () => {
  const router = useRouter();

  const [triggerShake, setTriggerShake] = useState<boolean>(false);

  const inputRef = useRef<TextInput | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      phoneNumber: "",
    },
    resolver: zodResolver(schemaValidation),
  });

  const onSubmit = async (data: FormData) => {
    router.push({ params: data, pathname: "phone-number-otp" });
  };

  const onSubmitError = () => {
    setTriggerShake(true);
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
        <YStack flex={1} space="$8">
          <Text
            alignSelf="center"
            textAlign="center"
            fontSize={22}
            fontWeight="900"
          >
            What's your phone number?
          </Text>

          <YStack space="$3">
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                // TODO: set this up to work as a controlled input - onBlur, value, etc...
                <PhoneNumberInput
                  ref={inputRef}
                  onInputLayout={() => inputRef.current?.focus()}
                  onChange={({ dialingCode, phoneNumber, isValid }) =>
                    onChange(`${dialingCode}${phoneNumber}`)
                  }
                  modalContainerStyle={{
                    flex: 1,
                    backgroundColor: "$backgroundStrong",
                  }}
                  inputsContainerStyle={{
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
                    cursorColor: "white",
                    flex: 1,
                    borderWidth: 0,
                    fontSize: 32,
                    fontFamily: "$mono",
                    fontWeight: "900",
                    backgroundColor: "transparent",
                  }}
                />
              )}
            />
          </YStack>

          <Text
            alignSelf="center"
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
            onPress={handleSubmit(onSubmit, onSubmitError)}
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

export default PhoneNumber;
