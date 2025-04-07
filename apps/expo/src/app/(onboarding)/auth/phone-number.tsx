import React, { useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { validators } from "@oppfy/validators";

import {
  OnboardingButton,
  OnboardingPhoneInput,
  OnboardingScreen,
} from "~/components/ui/Onboarding";
import type { CountryData } from "~/data/groupedCountries";
import { useAuth } from "~/hooks/useAuth";

const PhoneNumber = () => {
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
      validators.phoneNumber.safeParse({
        phoneNumber,
        countryCode: countryData.countryCode,
      }).success,
    [phoneNumber, countryData.countryCode],
  );

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsLoading(true);
    setError(null);

    const e164PhoneNumber = `${countryData.dialingCode}${phoneNumber}`;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await sendVerificationCode(e164PhoneNumber);

      router.push({
        params: {
          phoneNumber: e164PhoneNumber,
        },
        pathname: "/auth/otp",
      });
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
};

export default PhoneNumber;
