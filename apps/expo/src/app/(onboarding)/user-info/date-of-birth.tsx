import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import DatePicker from "react-native-date-picker";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { sharedValidators } from "@oppfy/validators";

import { H2, ScreenView, YStack } from "~/components/ui";
import {
  DisclaimerText,
  InputWrapper,
  OnboardingButton,
  OnboardingInput,
} from "~/features/onboarding/components";
import { api } from "~/utils/api";

const DateOfBirth = () => {
  const router = useRouter();

  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);

  const updateProfile = api.profile.updateProfile.useMutation();

  const isValidDateOfBirth =
    sharedValidators.user.dateOfBirth.safeParse(dateOfBirth).success;

  const onSubmit = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (dateOfBirth === null) return;

    await updateProfile.mutateAsync({
      dateOfBirth,
    });

    router.push("/user-info/username");
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
        <H2 textAlign="center">When's your{"\n"}birthday?</H2>

        <TouchableOpacity onPress={() => setOpen(true)}>
          <InputWrapper>
            <OnboardingInput
              placeholder="Birthday"
              textAlign="center"
              pointerEvents="none"
            >
              {dateOfBirth?.toLocaleDateString()}
            </OnboardingInput>
          </InputWrapper>
        </TouchableOpacity>

        <DisclaimerText>You must be 13+ to use OPPFY.</DisclaimerText>
      </YStack>

      <OnboardingButton
        marginHorizontal="$-4"
        onPress={onSubmit}
        disabled={!isValidDateOfBirth}
      >
        Continue
      </OnboardingButton>

      <DatePicker
        modal
        mode="date"
        open={open}
        date={dateOfBirth ? dateOfBirth : new Date()}
        onConfirm={(date) => {
          setOpen(false);
          setDateOfBirth(date);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </ScreenView>
  );
};

export default DateOfBirth;
