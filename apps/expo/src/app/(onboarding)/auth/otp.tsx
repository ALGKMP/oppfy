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

export default function PhoneNumberOTP() {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const { verifyPhoneNumber } = useAuth();

  const [phoneNumberOTP, setPhoneNumberOTP] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isValidPhoneNumberOTP = useMemo(
    () =>
      sharedValidators.user.phoneNumberOTP.safeParse(phoneNumberOTP).success,
    [phoneNumberOTP],
  );

  const onSubmit = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!phoneNumber) {
      setError("Invalid phone number");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await verifyPhoneNumber(phoneNumber, phoneNumberOTP);
      // Navigation is now handled in the SessionContext
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message);
      } else {
        setError("An unknown error occurred. Please try again later.");
      }
    }

    setIsLoading(false);
  };

  return (
    <OnboardingScreen
      title={`Enter your ${"\n "} verification code`}
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
