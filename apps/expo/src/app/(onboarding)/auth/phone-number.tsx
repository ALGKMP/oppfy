import React, { useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { sharedValidators } from "@oppfy/validators";

import {
  OnboardingButton,
  OnboardingPhoneInput,
  OnboardingScreen,
} from "~/components/ui/Onboarding";
import type { CountryData } from "~/data/groupedCountries";
import { useAuth } from "~/hooks/useAuth";

enum TwilioError {
  INVALID_PHONE_NUMBER = "Invalid phone number format. Please use a valid phone number.",
  INVALID_PARAMETER = "Invalid parameter. Please check your input and try again.",
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

export default function PhoneNumber() {
  const router = useRouter();
  const { sendVerificationCode } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryData, setCountryData] = useState<CountryData>({
    name: "United States",
    countryCode: "US",
    dialingCode: "+1",
    flag: "🇺🇸",
  });

  const isValidPhoneNumber = useMemo(
    () =>
      sharedValidators.user.phoneNumber.safeParse({
        phoneNumber,
        countryCode: countryData.countryCode,
      }).success,
    [phoneNumber, countryData.countryCode],
  );

  const [error, setError] = useState<TwilioError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsLoading(true);
    setError(null);

    const e164PhoneNumber = `${countryData.dialingCode}${phoneNumber}`;

    try {
      const success = await sendVerificationCode(e164PhoneNumber);

      if (success) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        router.push({
          params: {
            phoneNumber: e164PhoneNumber,
          },
          pathname: "/auth/otp",
        });
      }
    } catch (err: unknown) {
      console.error("Error sending verification code:", err);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err && typeof err === "object" && "message" in err) {
        const errorMessage = (err as { message: string }).message;
        switch (errorMessage) {
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
    <OnboardingScreen
      title="What's your phone number?"
      error={error}
      footer={
        <OnboardingButton
          onPress={onSubmit}
          disabled={!isValidPhoneNumber || isLoading}
          isLoading={isLoading}
          isValid={isValidPhoneNumber}
          text={isLoading ? "Sending..." : "Send Verification Text"}
        />
      }
      successMessage={
        !error
          ? "By Continuing you agree to our Privacy Policy and Terms of Service."
          : undefined
      }
    >
      <OnboardingPhoneInput
        value={phoneNumber}
        onChangeText={(text) => {
          setPhoneNumber(text);
          setError(null);
        }}
        countryData={countryData}
        onCountryChange={setCountryData}
      />
    </OnboardingScreen>
  );
}
