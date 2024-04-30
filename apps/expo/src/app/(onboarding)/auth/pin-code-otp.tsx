import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { TextInput } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
// import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { Button, Input, Spinner, Text, View, XStack, YStack } from "tamagui";
import * as z from "zod";

import { PinCodeInput } from "~/components/Inputs";
import { KeyboardSafeView } from "~/components/SafeViews";
import { useSession } from "~/contexts/SessionsContext";
import useCooldown from "~/hooks/useCooldown";
import useParams from "~/hooks/useParams";
import { api } from "~/utils/api";

enum Error {
  INCORRECT_CODE = "Incorrect code. Try again.",
  ERROR_SENDING_CODE = "Error sending code. Try again later.",
  UNKNOWN_ERROR = "An unknown error occurred. Please try again later.",
}

export interface SignUpFlowParams {
  [key: string]: string;
  phoneNumber: string;
}

const phoneNumberOTPValidation = z.object({
  phoneNumberOTP: z.string().length(6),
});

const PhoneNumberOTP = () => {
  const router = useRouter();
  const signUpFlowParams = useParams<SignUpFlowParams>();

  const { verifyPhoneNumberOTP } = useSession();

  const [phoneNumberOTP, setPhoneNumberOTP] = useState("");
  const [error, setError] = useState<Error | null>(null);

  const createUser = api.auth.createUser.useMutation();
  const userOnboardingCompleted =
    api.user.userOnboardingCompleted.useMutation();

  const isValidPhoneNumberOTP = phoneNumberOTPValidation.safeParse({
    phoneNumberOTP,
  }).success;

  const handleNewUser = async (userId: string) => {
    await createUser.mutateAsync({
      userId,
    });
    router.replace("/user-info/welcome");
  };

  const handleExistingUser = async (userId: string) => {
    await userOnboardingCompleted.mutateAsync({
      userId,
    });

    userOnboardingCompleted.data
      ? router.replace("/user-info/welcome")
      : router.replace("/(app)/(bottom-tabs)/profile");
  };

  const onSubmit = async () => {
    let userCredential: FirebaseAuthTypes.UserCredential | null = null;

    try {
      userCredential = await verifyPhoneNumberOTP(phoneNumberOTP);
    } catch (err) {
      setError(Error.INCORRECT_CODE);
      return;
    }

    if (!userCredential) {
      setError(Error.UNKNOWN_ERROR);
      return;
    }

    const isNewUser = userCredential.additionalUserInfo?.isNewUser;
    const userId = userCredential.user.uid;

    if (!userId) {
      setError(Error.UNKNOWN_ERROR);
      return;
    }

    isNewUser ? await handleNewUser(userId) : await handleExistingUser(userId);
  };

  return (
    <KeyboardSafeView>
      <View flex={1} padding="$4" backgroundColor="$background">
        <YStack flex={1} gap="$4">
          <Text fontSize="$8" fontWeight="bold">
            Please enter your code.
          </Text>

          <XStack gap="$2">
            <Input
              flex={1}
              value={phoneNumberOTP}
              onChangeText={setPhoneNumberOTP}
              placeholder="6 Digit Code"
              keyboardType="phone-pad"
            />
          </XStack>

          {error ? (
            <Text color="$red9">{error}</Text>
          ) : (
            <Text color="$gray9">
              Verification code sent to {signUpFlowParams.phoneNumber}
            </Text>
          )}
        </YStack>

        <Button
          onPress={onSubmit}
          disabled={!isValidPhoneNumberOTP}
          disabledStyle={{ opacity: 0.5 }}
        >
          Welcome
        </Button>
      </View>
    </KeyboardSafeView>
  );
};

// ! This is for testing purposes only, do not use in production
auth().settings.appVerificationDisabledForTesting = true;

export default PhoneNumberOTP;
