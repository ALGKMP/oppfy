import React, { useRef } from "react";
import type { TextInput } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { isValidNumber } from "libphonenumber-js";
import { Controller, useForm } from "react-hook-form";
import { Button, Text, View, YStack } from "tamagui";
import * as z from "zod";

import { PhoneNumberInput } from "~/components/Inputs";
import { usePermissions } from "~/contexts/PermissionsContext";

const Intro = () => {
  const router = useRouter();
  const { permissions } = usePermissions();

  const allPermissions = Object.values(permissions).every((p) => p === true);

  const onSubmit = () => {
    allPermissions ? router.push("phone-number") : router.push("(permissions)");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View
        flex={1}
        backgroundColor="$backgroundStrong"
        padding="$6"
        justifyContent="space-between"
      >
        <YStack flex={1} space="$8" alignItems="center"></YStack>

        <View alignSelf="stretch" marginTop="auto">
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

export default Intro;
