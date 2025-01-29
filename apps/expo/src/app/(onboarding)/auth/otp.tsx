import React, { useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";

import { sharedValidators } from "@oppfy/validators";

import {
  OnboardingButton,
  OnboardingOTPInput,
  OnboardingScreen,
} from "~/components/ui/Onboarding";
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

export default function PhoneNumberOTP() {
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
    <OnboardingScreen
      title="Enter your verification code"
      subtitle="We sent a code to your phone"
      error={error}
      footer={
        <OnboardingButton
          onPress={onSubmit}
          disabled={!isValidPhoneNumberOTP || isLoading}
          isLoading={isLoading}
          isValid={isValidPhoneNumberOTP}
          text={isLoading ? "Verifying..." : "Verify Code"}
        />
      }
      successMessage={
        !error ? `Verification code sent to ${phoneNumber}` : undefined
      }
    >
      <OnboardingOTPInput
        value={phoneNumberOTP}
        onChange={(value) => {
          setPhoneNumberOTP(value);
          setError(null);
        }}
      />
    </OnboardingScreen>
  );
}
