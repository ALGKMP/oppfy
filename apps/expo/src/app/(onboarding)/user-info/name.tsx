import React, { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import { useNavigation, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { sharedValidators } from "@oppfy/validators";

import {
  H2,
  Icon,
  OnboardingButton,
  OnboardingInput,
  Paragraph,
  ScreenView,
  useAlertDialogController,
  YStack,
} from "~/components/ui";
import { useAuth } from "~/hooks/useAuth";
import { api } from "~/utils/api";

const Name = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const alertDialog = useAlertDialogController();

  const { signOut } = useAuth();

  const [name, setName] = useState("");
  const updateProfile = api.profile.updateProfile.useMutation();

  const isValidName = sharedValidators.user.name.safeParse(name).success;

  const onSubmit = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await updateProfile.mutateAsync({
      name,
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
      <YStack alignItems="center" gap="$6">
        <H2 textAlign="center">What's your{"\n"} name?</H2>

        <OnboardingInput
          value={name}
          onChangeText={setName}
          textAlign="center"
          autoComplete="off"
          autoFocus
        />

        <Paragraph size="$5" color="$gray11" textAlign="center">
          This is how we'll address you. You can always change it later.
        </Paragraph>
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
