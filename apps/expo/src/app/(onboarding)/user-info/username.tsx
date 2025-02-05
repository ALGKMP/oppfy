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
  "Enter a username",
  "Pick your username",
  "Choose your handle",
  "Create your username",
];

enum Error {
  USERNAME_TAKEN = "Username is already taken.",
  UNKNOWN = "Something went wrong. Please try again.",
}

const Username = () => {
  const router = useRouter();
  const updateProfile = api.profile.updateProfile.useMutation();

  const [username, setUsername] = useState("");
  const [error, setError] = useState<Error | null>(null);

  const isValidUsername = sharedValidators.user.username.safeParse(
    username.toLowerCase(),
  ).success;

  const handleSubmit = async () => {
    if (!isValidUsername) return;

    try {
      await updateProfile.mutateAsync({ username: username.toLowerCase() });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/user-info/date-of-birth");
    } catch (err) {
      if (isTRPCClientError(err)) {
        switch (err.data?.code) {
          case "CONFLICT":
            setError(Error.USERNAME_TAKEN);
            break;
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
      subtitle="Create your identity"
      title="Choose a username!"
      error={error}
      footer={
        <OnboardingButton
          onPress={handleSubmit}
          disabled={!isValidUsername}
          isLoading={updateProfile.isPending}
          isValid={isValidUsername}
        />
      }
    >
      <OnboardingInput
        value={username}
        onChangeText={(text) => {
          const formattedText = text.replace(/\s/g, "_");
          setUsername(formattedText);
          setError(null);
        }}
        placeholders={PLACEHOLDERS}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
      />
    </OnboardingScreen>
  );
};

export default Username;
