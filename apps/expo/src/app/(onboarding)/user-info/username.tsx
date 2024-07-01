import React, { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { H1, YStack } from "tamagui";

import { sharedValidators } from "@oppfy/validators";

import { BaseScreenView, KeyboardSafeView } from "~/components/Views";
import {
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

  const updateUsername = api.profile.updateUsername.useMutation();

  const isValidUsername = useMemo(
    () => sharedValidators.user.username.safeParse(username).success,
    [username],
  );

  const onSubmit = async () => {
    try {
      await updateUsername.mutateAsync({
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
    <KeyboardSafeView>
      <BaseScreenView
        safeAreaEdges={["bottom"]}
        backgroundColor="$background"
        paddingBottom={0}
        paddingHorizontal={0}
      >
        <YStack flex={1} justifyContent="space-between">
          <YStack paddingHorizontal="$4" gap="$6">
            <H1 textAlign="center">Pick a username?</H1>

            <InputWrapper>
              <OnboardingInput
                value={username}
                onChangeText={setUsername}
                textAlign="center"
                autoFocus
              />
            </InputWrapper>

            {error ? (
              <DisclaimerText color="$red9">{error}</DisclaimerText>
            ) : (
              <DisclaimerText>
                Your username is how people find you on OPPFY. Your username
                must be unique.
              </DisclaimerText>
            )}
          </YStack>

          <OnboardingButton onPress={onSubmit} disabled={!isValidUsername}>
            Continue
          </OnboardingButton>
        </YStack>
      </BaseScreenView>
    </KeyboardSafeView>
  );
};

export default Username;
