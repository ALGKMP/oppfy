import React, { useMemo, useState } from "react";
import { TouchableOpacity } from "react-native";
import DatePicker from "react-native-date-picker";
import * as Haptics from "expo-haptics";
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
import { api } from "~/utils/api";

const DateOfBirth = () => {
  const router = useRouter();

  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);

  const updateProfile = api.profile.updateProfile.useMutation();

  const isValidDateOfBirth = useMemo(
    () => sharedValidators.user.dateOfBirth.safeParse(dateOfBirth).success,
    [dateOfBirth],
  );

  const onSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (dateOfBirth === null) return;

    await updateProfile.mutateAsync({
      dateOfBirth,
    });

    router.push("/user-info/username");
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
            <H1 textAlign="center">When&apos;s your birthday?</H1>

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

          <OnboardingButton onPress={onSubmit} disabled={!isValidDateOfBirth}>
            Continue
          </OnboardingButton>
        </YStack>

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
      </BaseScreenView>
    </KeyboardSafeView>
  );
};

export default DateOfBirth;
