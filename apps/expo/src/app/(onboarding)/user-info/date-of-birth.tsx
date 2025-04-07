import React, { useState } from "react";
import DatePicker from "react-native-date-picker";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { validators } from "@oppfy/validators";

import {
  OnboardingButton,
  OnboardingInput,
  OnboardingScreen,
} from "~/components/ui/Onboarding";
import { api, isTRPCClientError } from "~/utils/api";

const PLACEHOLDERS = [
  "Select your birthday",
  "When were you born?",
  "Enter your birth date",
  "Choose your birthday",
];

enum Error {
  UNKNOWN = "Something went wrong. Please try again.",
}

const DateOfBirth = () => {
  const router = useRouter();
  const updateProfile = api.profile.updateProfile.useMutation();

  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [error, setError] = useState<Error | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const isValidDateOfBirth =
    validators.dateOfBirth.safeParse(dateOfBirth).success;

  const handleSubmit = async () => {
    if (!isValidDateOfBirth || !dateOfBirth) return;

    try {
      await updateProfile.mutateAsync({ dateOfBirth });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/user-info/profile-picture");
    } catch (err) {
      if (isTRPCClientError(err)) {
        switch (err.data?.code) {
          default:
            setError(Error.UNKNOWN);
            break;
        }
      } else {
        setError(Error.UNKNOWN);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleDateConfirm = (date: Date) => {
    setIsOpen(false);
    setDateOfBirth(date);
    setError(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <OnboardingScreen
      subtitle="Must be 13 years or older"
      title="When's your birthday?"
      error={error}
      footer={
        <OnboardingButton
          onPress={handleSubmit}
          disabled={!isValidDateOfBirth}
          isLoading={updateProfile.isPending}
          isValid={isValidDateOfBirth}
        />
      }
    >
      <OnboardingInput
        value={dateOfBirth?.toLocaleDateString() ?? ""}
        onChangeText={() => {}}
        placeholders={PLACEHOLDERS}
        autoFocus
        onPressIn={() => {
          setIsOpen(true);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        editable={false}
      />
      <DatePicker
        modal
        mode="date"
        open={isOpen}
        date={dateOfBirth ?? new Date()}
        onConfirm={handleDateConfirm}
        onCancel={() => setIsOpen(false)}
      />
    </OnboardingScreen>
  );
};

export default DateOfBirth;
