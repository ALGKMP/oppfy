import React from "react";
import { useRouter } from "expo-router";
import { Button, Text, YStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import { usePermissions } from "~/contexts/PermissionsContext";

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
    <BaseScreenView safeAreaEdges={["bottom"]}>
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Text fontFamily="$modak" fontSize={64} margin={-24}>
          OPPFY
        </Text>
        <Text fontSize={24} fontWeight="700">
          Capture Real Memories.
        </Text>
      </YStack>

      <Button onPress={onSubmit}>Welcome</Button>
    </BaseScreenView>
  );
};

export default Start;
