import React, { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { Paragraph, styled } from "tamagui";

import { sharedValidators } from "@oppfy/validators";

import {
  H2,
  OnboardingButton,
  ScreenView,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import { useSession } from "~/contexts/SessionContext";

enum Error {
  INCORRECT_CODE = "Incorrect code. Try again.",
  ERROR_SENDING_CODE = "Error sending code. Try again later.",
  INVALID_PHONE_NUMBER = "Invalid phone number. Please check the number and try again.",
  QUOTA_EXCEEDED = "SMS quota exceeded. Please try again later.",
  CODE_EXPIRED = "The verification code has expired. Please request a new code.",
  MISSING_VERIFICATION_CODE = "Verification code is missing. Please enter the code.",
  NETWORK_REQUEST_FAILED = "Network error. Please check your connection and try again.",
  TOO_MANY_REQUESTS = "Too many attempts. Please try again later.",
  UNKNOWN_ERROR = "An unknown error occurred. Please try again later.",
}

const PhoneNumberOTP = () => {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const { verifyPhoneNumber } = useSession();

  const [phoneNumberOTP, setPhoneNumberOTP] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isValidPhoneNumberOTP = useMemo(
    () =>
      sharedValidators.user.phoneNumberOTP.safeParse(phoneNumberOTP).success,
    [phoneNumberOTP],
  );

  const onSubmit = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!phoneNumber) {
      setError(Error.INVALID_PHONE_NUMBER);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await verifyPhoneNumber(phoneNumber, phoneNumberOTP);
      // Navigation is now handled in the SessionContext
    } catch (error: unknown) {
      console.error("Error verifying code:", error);
      if (error && typeof error === "object" && "message" in error) {
        const errorMessage = (error as { message: string }).message;
        switch (errorMessage) {
          case "BAD_REQUEST":
            setError(Error.INCORRECT_CODE);
            break;
          case "QUOTA_EXCEEDED":
            setError(Error.QUOTA_EXCEEDED);
            break;
          case "CODE_EXPIRED":
            setError(Error.CODE_EXPIRED);
            break;
          case "NETWORK_REQUEST_FAILED":
            setError(Error.NETWORK_REQUEST_FAILED);
            break;
          case "TOO_MANY_REQUESTS":
            setError(Error.TOO_MANY_REQUESTS);
            break;
          default:
            setError(Error.UNKNOWN_ERROR);
        }
      } else {
        setError(Error.UNKNOWN_ERROR);
      }
    }

    setIsLoading(false);
  };

  return (
    <ScreenView
      paddingBottom={0}
      paddingTop="$10"
      justifyContent="space-between"
      keyboardAvoiding
      safeAreaEdges={["bottom"]}
    >
      <YStack alignItems="center" gap="$6">
        <H2 textAlign="center">Enter your{"\n"}verification code</H2>

        <OTPInput
          value={phoneNumberOTP}
          onChange={(value) => {
            setPhoneNumberOTP(value);
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        />

        {error ? (
          <Paragraph size="$5" color="$red9" textAlign="center">
            {error}
          </Paragraph>
        ) : (
          <Paragraph size="$5" color="$gray11" textAlign="center">
            Verification code sent to{" "}
            <Text fontWeight="bold">{phoneNumber}</Text>
          </Paragraph>
        )}
      </YStack>

      <OnboardingButton
        marginHorizontal="$-4"
        onPress={onSubmit}
        disabled={!isValidPhoneNumberOTP || isLoading}
      >
        {isLoading ? <Spinner /> : "Verify Code"}
      </OnboardingButton>
    </ScreenView>
  );
};

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
}

const OTPInput = ({ value, onChange }: OTPInputProps) => {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const handleChangeText = useCallback(
    (text: string) => {
      const newValue = text.replace(/[^0-9]/g, "").slice(0, 6);
      onChange(newValue);
    },
    [onChange],
  );

  const handlePress = useCallback(() => {
    inputRef.current?.focus();
    setFocused(true);
  }, []);

  return (
    <TouchableOpacity activeOpacity={1} onPress={handlePress}>
      <View>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          keyboardType="number-pad"
          maxLength={6}
          style={styles.hiddenInput}
          autoFocus={true}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <XStack width="100%" justifyContent="space-between">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <OTPBox
              key={index}
              {...(focused &&
                (index === value.length ||
                  (value.length === 6 && index === 5)) && {
                  focused: true,
                })}
            >
              <Text fontSize={24} fontWeight="bold">
                {value[index]}
              </Text>
            </OTPBox>
          ))}
        </XStack>
      </View>
    </TouchableOpacity>
  );
};

const OTPBox = styled(View, {
  width: 44,
  height: 48,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "$gray7",
  alignItems: "center",
  justifyContent: "center",
  variants: {
    focused: {
      true: {
        borderColor: "$blue9",
      },
    },
  },
});

const styles = StyleSheet.create({
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export default PhoneNumberOTP;
