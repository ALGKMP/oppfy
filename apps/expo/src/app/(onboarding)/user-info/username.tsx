import React, { useState } from "react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { sharedValidators } from "@oppfy/validators";

import {
  H2,
  OnboardingButton,
  OnboardingInput,
  Paragraph,
  ScreenView,
  YStack,
} from "~/components/ui";
import { api, isTRPCClientError } from "~/utils/api";

enum Error {
  USERNAME_TAKEN = "Username is already taken.",
}

const Username = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [error, setError] = useState<Error | null>(null);

  const updateProfile = api.profile.updateProfile.useMutation();

  const isValidUsername = sharedValidators.user.username.safeParse(
    username.toLowerCase(),
  ).success;

  const handleUsernameChange = (text: string) => {
    const formattedText = text.replace(/\s/g, "_");
    setUsername(formattedText);
  };

  const onSubmit = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await updateProfile.mutateAsync({
        username: username.toLowerCase(),
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
      <YStack alignItems="center" gap="$6">
        <H2 textAlign="center">Choose a{"\n"}username!</H2>

        <OnboardingInput
          value={username}
          onChangeText={handleUsernameChange}
          textAlign="center"
          autoCorrect={false}
          autoCapitalize="none"
          autoFocus
        />

        {error ? (
          <Paragraph size="$5" color="$red9" textAlign="center">
            {error}
          </Paragraph>
        ) : (
          <Paragraph size="$5" color="$gray11" textAlign="center">
            Your username is how people find you. Your username must be unique.
          </Paragraph>
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
