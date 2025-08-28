import React from "react";
import { useRouter } from "expo-router";
import { Text, View } from "~/components/ui";

import { OnboardingButton, OnboardingScreen } from "~/components/ui/Onboarding";
import { api } from "~/utils/api";

const InviteContacts = () => {
  const router = useRouter();
  const markOnboardingComplete = api.user.markOnboardingComplete.useMutation();

  const handleContinue = async () => {
    try {
      await markOnboardingComplete.mutateAsync();
      router.replace("/(app)/(bottom-tabs)/(home)");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  return (
    <OnboardingScreen
      title="Invite Friends"
      footer={
        <OnboardingButton
          onPress={handleContinue}
          text="Continue"
          isValid={true}
        />
      }
    >
      <View>
        <Text>Invite Contacts</Text>
      </View>
      {/* Content will be added here */}
    </OnboardingScreen>
  );
};

export default InviteContacts;
