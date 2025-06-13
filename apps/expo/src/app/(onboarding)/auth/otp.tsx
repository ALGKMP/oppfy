import React, { useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";

import { validators } from "@oppfy/validators";

import {
  OnboardingButton,
  OnboardingOTPInput,
  OnboardingScreen,
} from "~/components/ui/Onboarding";
import { authClient } from "~/lib/auth-client";
import { api } from "~/utils/api";

const PhoneNumberOTP = () => {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();

  const router = useRouter();

  const userStatusMutation = api.user.fetchUserStatus.useMutation();

  const [phoneNumberOTP, setPhoneNumberOTP] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isValidPhoneNumberOTP = useMemo(
    () => validators.phoneNumberOTP.safeParse(phoneNumberOTP).success,
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

    const response = await authClient.phoneNumber.verify({
      phoneNumber,
      code: phoneNumberOTP,
    });

    if (response.error) {
      if (response.error.message) {
        setError(response.error.message);
      } else {
        setError("An unknown error occurred. Please try again later.");
      }

      setIsLoading(false);
      return;
    }

    const isNewUser =
      response.data.user.createdAt === response.data.user.updatedAt;

    if (isNewUser) {
      router.replace("/user-info/name");
      return;
    }

    const userStatus = await userStatusMutation.mutateAsync();

    if (!userStatus.hasCompletedOnboarding) {
      router.replace("/user-info/name");
      return;
    }

    router.replace("/(app)/(bottom-tabs)/(home)");

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
};

export default PhoneNumberOTP;
