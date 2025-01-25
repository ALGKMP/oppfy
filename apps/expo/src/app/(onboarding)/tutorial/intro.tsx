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

const Explanation = () => {
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

    router.replace("/user-info/username");
  };

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Icon
          name="close"
          onPress={async () => {
            const confirmed = await alertDialog.show({
              title: "Exit Onboarding",
              subtitle:
                "Are you sure you want to quit? You're just one step away from completing the onboarding process.",
              acceptText: "Exit",
              cancelText: "Cancel",
            });

            console.log("confirmed", confirmed);

            if (confirmed) {
              signOut();
            }
          }}
          blurred
        />
      ),
    });
  }, [navigation, signOut, alertDialog]);

  useEffect(() => void SplashScreen.hideAsync(), []);

  return (
    <ScreenView
      paddingBottom={0}
      paddingTop="$10"
      justifyContent="space-between"
      keyboardAvoiding
      safeAreaEdges={["bottom"]}
    >
      <H2 textAlign="center">TUTORIAL THING</H2>

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

export default Explanation;
