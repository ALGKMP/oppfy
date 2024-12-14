import React, { useState } from "react";
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
import { api } from "~/utils/api";

const Name = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const updateProfile = api.profile.updateProfile.useMutation();

  const isValidName = sharedValidators.user.name.safeParse(name).success;

  const onSubmit = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await updateProfile.mutateAsync({
      name,
    });

    router.push("/user-info/date-of-birth");
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
        <H2 textAlign="center">What's your{"\n"} name?</H2>

        <InputWrapper>
          <OnboardingInput
            value={name}
            onChangeText={setName}
            textAlign="center"
            autoComplete="off"
            autoFocus
          />
        </InputWrapper>

        <DisclaimerText>
          By continuing, you agree to our <BoldText>Privacy Policy</BoldText>{" "}
          and <BoldText>Terms of Service</BoldText>.
        </DisclaimerText>
      </YStack>

      <OnboardingButton
        marginHorizontal="$-4"
        onPress={onSubmit}
        disabled={!isValidName}
      >
        Continue
      </OnboardingButton>
    </ScreenView>
  );
};

export default Name;
