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
import { useAuth } from "~/hooks/useAuth";

enum TwilioError {
  INVALID_PHONE_NUMBER = "Invalid phone number format. Please use a valid phone number.",
  INVALID_PARAMETER = "Invalid parameter. Please check your input and try again.",
  INVALID_CODE = "Incorrect verification code. Please try again.",
  CODE_EXPIRED = "The verification code has expired. Please request a new code.",
  RESOURCE_NOT_FOUND = "Service not found. Please try again later.",
  CAPABILITY_NOT_ENABLED = "This capability is not enabled. Please contact support.",
  AUTHENTICATION_FAILED = "Authentication failed. Please try again later.",
  FORBIDDEN = "Access denied. Please try again later.",
  RATE_LIMIT_EXCEEDED = "Too many attempts. Please try again later.",
  QUOTA_EXCEEDED = "SMS quota exceeded. Please try again later.",
  SERVICE_UNAVAILABLE = "Service temporarily unavailable. Please try again later.",
  NETWORK_ERROR = "Network error. Please check your connection and try again.",
  UNKNOWN_ERROR = "An unknown error occurred. Please try again later.",
}

const PhoneNumberOTP = () => {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const { verifyPhoneNumber } = useAuth();

  const [phoneNumberOTP, setPhoneNumberOTP] = useState("");
  const [error, setError] = useState<TwilioError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isValidPhoneNumberOTP = useMemo(
    () =>
      sharedValidators.user.phoneNumberOTP.safeParse(phoneNumberOTP).success,
    [phoneNumberOTP],
  );

  const onSubmit = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!phoneNumber) {
      setError(TwilioError.INVALID_PHONE_NUMBER);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await verifyPhoneNumber(phoneNumber, phoneNumberOTP);
      // Navigation is now handled in the SessionContext
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        const errorMessage = (err as { message: string }).message;
        console.log("Error message:", err);
        switch (errorMessage) {
          case "Invalid Verification Code":
            setError(TwilioError.INVALID_CODE);
            break;
          case "Failed to verify code":
            setError(TwilioError.INVALID_CODE);
            break;
          case "60200": // Invalid parameter
            setError(TwilioError.INVALID_PARAMETER);
            break;
          case "60203": // Invalid phone number
            setError(TwilioError.INVALID_PHONE_NUMBER);
            break;
          case "60404": // Service not found
            setError(TwilioError.RESOURCE_NOT_FOUND);
            break;
          case "60405": // Capability not enabled
            setError(TwilioError.CAPABILITY_NOT_ENABLED);
            break;
          case "60401": // Authentication failed
            setError(TwilioError.AUTHENTICATION_FAILED);
            break;
          case "60403": // Forbidden
            setError(TwilioError.FORBIDDEN);
            break;
          case "60429": // Too many requests
            setError(TwilioError.RATE_LIMIT_EXCEEDED);
            break;
          case "60435": // Quota exceeded
            setError(TwilioError.QUOTA_EXCEEDED);
            break;
          case "60503": // Service unavailable
            setError(TwilioError.SERVICE_UNAVAILABLE);
            break;
          case "20404": // Invalid code
            setError(TwilioError.INVALID_CODE);
            break;
          case "20401": // Code expired
            setError(TwilioError.CODE_EXPIRED);
            break;
          case "NETWORK_REQUEST_FAILED":
            setError(TwilioError.NETWORK_ERROR);
            break;
          default:
            setError(TwilioError.UNKNOWN_ERROR);
        }
      } else {
        setError(TwilioError.UNKNOWN_ERROR);
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
                  backgroundColor: "$gray4",
                })}
            >
              <Text fontSize="$7" fontWeight="bold" color="$color">
                {value[index] ?? ""}
              </Text>
              {focused &&
                (index === value.length ||
                  (value.length === 6 && index === 5)) && (
                  <View style={styles.cursor} />
                )}
            </OTPBox>
          ))}
        </XStack>
      </View>
    </TouchableOpacity>
  );
};

const OTPBox = styled(View, {
  width: 50,
  height: 60,
  borderRadius: "$6",
  backgroundColor: "$gray3",
  justifyContent: "center",
  alignItems: "center",
  shadowColor: "$gray6",
  shadowRadius: 5,
  shadowOpacity: 0.2,
});

const styles = StyleSheet.create({
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  cursor: {
    width: 2,
    height: 32,
    backgroundColor: "$color",
    position: "absolute",
  },
});

export default PhoneNumberOTP;
