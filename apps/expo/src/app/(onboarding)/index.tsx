import React from "react";
import { useRouter } from "expo-router";
import { Button, H1, Text, YStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import { usePermissions } from "~/contexts/PermissionsContext";
import { OnboardingButton } from "~/features/onboarding/components";

const Start = () => {
  const router = useRouter();
  const { permissions } = usePermissions();

  const requiredPermissions = permissions.camera && permissions.contacts;

  const onSubmit = () => {
    requiredPermissions
      ? router.push("/auth/phone-number")
      : router.push("/misc/permissions");
  };

  return (
    <BaseScreenView safeAreaEdges={["bottom"]} paddingHorizontal={0}>
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        paddingHorizontal="$4"
      >
        <Text fontFamily="$modak" fontSize={96} margin={-34}>
          OPPFY
        </Text>
        <Text fontSize={24} fontWeight="700">
          Capture Real Memories.
        </Text>
      </YStack>

      <OnboardingButton onPress={onSubmit}>Welcome</OnboardingButton>
    </BaseScreenView>
  );
};

export default Start;
