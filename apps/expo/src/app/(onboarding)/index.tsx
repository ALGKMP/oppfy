import React from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Button, Text, View, YStack } from "tamagui";

import { usePermissions } from "~/contexts/PermissionsContext";

const Start = () => {
  const router = useRouter();
  const { permissions } = usePermissions();

  const requiredPermissions =
    permissions.camera && permissions.contacts && permissions.notifications;

  const onSubmit = () => {
    requiredPermissions
      ? router.push("auth/phone-number")
      : router.push("permissions");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View
        flex={1}
        padding="$6"
        backgroundColor="black"
        justifyContent="space-between"
      >
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text fontSize={64} fontWeight="700">
            OPPFY.
          </Text>
          <Text fontSize={24} fontWeight="700">
            Capture Real Memories.
          </Text>
        </YStack>

        <View>
          <Button
            onPress={onSubmit}
            borderWidth={0}
            pressStyle={{
              backgroundColor: "$gray12",
            }}
            backgroundColor="white"
          >
            <Text color="black" fontSize={16} fontWeight="600">
              Next
            </Text>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Start;
