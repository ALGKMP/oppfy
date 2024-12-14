import React, { useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { sharedValidators } from "@oppfy/validators";

import { H2, ScreenView, YStack } from "~/components/ui";
import {
  BoldText,
  DisclaimerText,
  InputWrapper,
  OnboardingButton,
  OnboardingInput,
} from "~/features/onboarding/components";
import { api, isTRPCClientError } from "~/utils/api";

enum Error {
  USERNAME_TAKEN = "Username is already taken.",
}

const Username = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [error, setError] = useState<Error | null>(null);

  const updateProfile = api.profile.updateProfile.useMutation();

  const isValidUsername =
    sharedValidators.user.username.safeParse(username).success;

  const onSubmit = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await updateProfile.mutateAsync({
        username,
      });

      router.push("/user-info/profile-picture");
    } catch (error) {
      if (isTRPCClientError(error)) {
        switch (error.data?.code) {
          case "CONFLICT":
            setError(Error.USERNAME_TAKEN);
            break;
        }
      }
    }
  };

  return (
    <ScreenView
      paddingBottom={0}
      paddingTop="$10"
      justifyContent="space-between"
      keyboardAvoiding
      safeAreaEdges={["bottom"]}
    >
      <YStack paddingHorizontal="$4" gap="$6">
        <H2 textAlign="center">Choose a{"\n"}username!</H2>

        <InputWrapper>
          <OnboardingInput
            value={username}
            onChangeText={setUsername}
            textAlign="center"
            autoComplete="off"
            autoFocus
          />
        </InputWrapper>

        {error ? (
          <BoldText color="$red9">{error}</BoldText>
        ) : (
          <DisclaimerText>
            Your username is how people find you. Your username must be unique.
          </DisclaimerText>
        )}
      </YStack>

      <OnboardingButton
        marginHorizontal="$-4"
        onPress={onSubmit}
        disabled={!isValidUsername}
      >
        Continue
      </OnboardingButton>
    </ScreenView>
  );
};

export default Username;
