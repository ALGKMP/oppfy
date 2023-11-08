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
import { useSession } from "~/contexts/SessionsContext";

const DeleteAccount = () => {
  const router = useRouter();
  const { deleteAccount } = useSession();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View
        flex={1}
        backgroundColor="black"
        padding="$6"
        justifyContent="space-between"
      >
        <YStack space="$6">
          <Text
            fontSize={22}
            fontWeight="900"
            alignSelf="center"
            textAlign="center"
          >
            Are you sure you want to delete your account?
          </Text>

          <Text
            fontWeight="700"
            alignSelf="center"
            textAlign="center"
            color="$red9"
          >
            Your account and all your data will be permanently deleted. This
            action cannot be undone.
          </Text>
        </YStack>

        <View marginTop="auto">
          <YStack space={8}>
            <Button
              onPress={() => router.back()}
              size="$4.5"
              backgroundColor="$gray1"
            >
              <Text color="$blue11" fontSize={16} fontWeight="600">
                I changed my mind
              </Text>
            </Button>

            <Button
              onPress={deleteAccount}
              size="$4.5"
              backgroundColor="$gray1"
            >
              <Text color="$red9" fontSize={16} fontWeight="600">
                Yes, I'm sure
              </Text>
            </Button>
          </YStack>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default DeleteAccount;
