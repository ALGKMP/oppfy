import React, { useMemo, useState } from "react";
import { BackHandler } from "react-native";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useFocusEffect, useRouter } from "expo-router";

import { validators } from "@oppfy/validators";

import { Anchor, Text } from "~/components/ui";
import {
  OnboardingButton,
  OnboardingPhoneInput,
  OnboardingScreen,
} from "~/components/ui/Onboarding";
import type { CountryData } from "~/data/groupedCountries";
import { authClient } from "~/lib/auth-client";

const PhoneNumber = () => {
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryData, setCountryData] = useState<CountryData>({
    name: "United States",
    countryCode: "US",
    dialingCode: "+1",
    flag: "🇺🇸",
  });

  // Disable back navigation
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Return true to prevent going back
        return true;
      };

      // Add back button handler for Android
      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      // Cleanup
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, []),
  );

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

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const response = await authClient.phoneNumber.sendOtp({
      phoneNumber: e164PhoneNumber,
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

    router.push({
      params: {
        phoneNumber: e164PhoneNumber,
      },
      pathname: "/auth/otp",
    });

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
        !error ? (
          <Text textAlign="center" fontSize="$5" color="rgba(255,255,255,0.8)">
            By Continuing you agree to our{" "}
            <Anchor
              href="https://www.oppfy.app/privacy"
              onPress={() => Linking.openURL("https://www.oppfy.app/privacy")}
              fontWeight="bold"
              textDecorationLine="underline"
            >
              Privacy Policy
            </Anchor>{" "}
            and{" "}
            <Anchor
              href="https://www.oppfy.app/terms"
              onPress={() => Linking.openURL("https://www.oppfy.app/terms")}
              fontWeight="bold"
              textDecorationLine="underline"
            >
              Terms of Service
            </Anchor>
            .
          </Text>
        ) : undefined
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
