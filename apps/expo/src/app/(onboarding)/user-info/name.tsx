import React, { useState } from "react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { sharedValidators } from "@oppfy/validators";

import {
  OnboardingButton,
  OnboardingInput,
  OnboardingScreen,
} from "~/components/ui/Onboarding";
import { api, isTRPCClientError } from "~/utils/api";

const PLACEHOLDERS = [
  "Enter your name",
  "Type your name",
  "What should we call you?",
  "Your name goes here",
];

enum Error {
  UNKNOWN = "Something went wrong. Please try again.",
}

const Name = () => {
  const router = useRouter();
  const updateProfile = api.profile.updateProfile.useMutation();

  const [name, setName] = useState("");
  const [error, setError] = useState<Error | null>(null);

  const isValidName = sharedValidators.user.name.safeParse(name).success;

  const handleSubmit = async () => {
    if (!isValidName) return;

    try {
      await updateProfile.mutateAsync({ name });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/user-info/username");
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

  return (
    <OnboardingScreen
      title="What's your name?"
      subtitle="Tell us about yourself"
      error={error}
      footer={
        <OnboardingButton
          onPress={handleSubmit}
          disabled={!isValidName}
          isValid={isValidName}
          isLoading={updateProfile.isPending}
        />
      }
    >
      <OnboardingInput
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        placeholders={PLACEHOLDERS}
        autoFocus
        autoCapitalize="words"
        autoCorrect={false}
      />
    </OnboardingScreen>
  );
}

export default Name;
