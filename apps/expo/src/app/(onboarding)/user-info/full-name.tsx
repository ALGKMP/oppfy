import React, { useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { H1, YStack } from "tamagui";

import { sharedValidators } from "@oppfy/validators";

import { BaseScreenView, KeyboardSafeView } from "~/components/Views";
import {
  BoldText,
  DisclaimerText,
  InputWrapper,
  OnboardingButton,
  OnboardingInput,
} from "~/features/onboarding/components";
import { api } from "~/utils/api";

const Name = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const updateProfile = api.profile.updateProfile.useMutation();

  const isValidName = sharedValidators.user.name.safeParse(name).success;

  const onSubmit = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await updateProfile.mutateAsync({
      name: name,
    });

    router.push("/user-info/date-of-birth");
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
            <H1 textAlign="center">What's your{"\n"}full name?</H1>

            <InputWrapper>
              <OnboardingInput
                value={name}
                onChangeText={setName}
                textAlign="center"
                autoFocus
              />
            </InputWrapper>

            <DisclaimerText>
              By continuing, you agree to our{" "}
              <BoldText>Privacy Policy</BoldText> and{" "}
              <BoldText>Terms of Service</BoldText>.
            </DisclaimerText>
          </YStack>

          <OnboardingButton onPress={onSubmit} disabled={!isValidName}>
            Continue
          </OnboardingButton>
        </YStack>
      </BaseScreenView>
    </KeyboardSafeView>
  );
};

export default Name;
