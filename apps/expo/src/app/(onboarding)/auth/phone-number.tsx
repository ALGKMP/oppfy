import React, { useMemo, useRef, useState } from "react";
import type { TextInput } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { isValidNumber } from "libphonenumber-js";
import { Button, Text, View, YStack } from "tamagui";
import * as z from "zod";

import { PhoneNumberInput } from "~/components/Inputs";

const schemaValidation = z.object({
  phoneNumber: z.string().refine((phoneNumber) => isValidNumber(phoneNumber)),
});

const PhoneNumber = () => {
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState("");
  const phoneNumberInputRef = useRef<TextInput | null>(null);

  const phoneNumberIsValid = useMemo(
    () => schemaValidation.safeParse({ phoneNumber }).success,
    [phoneNumber],
  );

  const onPress = () =>
    router.push({ params: { phoneNumber }, pathname: "/auth/pin-code-otp" });

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
        <YStack flex={1} space="$8" alignItems="center">
          <Text
            alignSelf="center"
            textAlign="center"
            fontSize={22}
            fontWeight="900"
          >
            What&apos;s your phone number?
          </Text>

          <YStack space="$3">
            <PhoneNumberInput
              ref={phoneNumberInputRef}
              onLayout={() => phoneNumberInputRef.current?.focus()}
              onChange={({ dialingCode, phoneNumber }) =>
                setPhoneNumber(dialingCode + phoneNumber)
              }
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
              <Link key="privacy-policy" href="https://fill">
                <Text color="$gray10">Privacy Policy</Text>
              </Link>,
              " and ",
              <Link key="terms-of-service" href="https://fill">
                <Text color="$gray10">Terms of Service.</Text>
              </Link>,
            ]}
          </Text>
        </YStack>

        <Button
          onPress={onPress}
          borderWidth={0}
          pressStyle={{
            backgroundColor: "$gray12",
          }}
          backgroundColor={phoneNumberIsValid ? "white" : "gray"}
          disabled={!phoneNumberIsValid}
        >
          <Text
            color={phoneNumberIsValid ? "black" : "lightgray"}
            fontWeight="600"
            fontSize={16}
          >
            Next
          </Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

export default PhoneNumber;
