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
import auth from "@react-native-firebase/auth";
// import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { Button, Spinner, Text, View, YStack } from "tamagui";
import * as z from "zod";

import { PinCodeInput } from "~/components/Inputs";
import { useSession } from "~/contexts/SessionsContext";
import useCooldown from "~/hooks/useCooldown";
import useParams from "~/hooks/useParams";
import { api } from "~/utils/api";

export interface SignUpFlowParams {
  [key: string]: string;
  phoneNumber: string;
}

const schemaValidation = z.object({
  phoneNumberOTP: z.string().length(6),
});

const RESEND_CODE_COOLDOWN_DURATION_SEC = 60;

const PhoneNumberOTP = () => {
  const router = useRouter();
  const signUpFlowParams = useParams<SignUpFlowParams>();

  const pinCodeInputRef = useRef<TextInput | null>(null);

  const [phoneNumberOTP, setPhoneNumberOTP] = useState("");

  const [isSendingCode, setIsSendingCode] = useState(true);
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  const [codeChecked, setCodeChecked] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const { cooldown, resetCooldown } = useCooldown(
    RESEND_CODE_COOLDOWN_DURATION_SEC,
    { autoStart: true },
  );

  const createUser = api.auth.createUser.useMutation();
  const hasUserDetails = api.auth.hasUserDetails.useMutation();

  const { verifyPhoneNumberOTP, signInWithPhoneNumber } = useSession();

  const buttonIsDisabled = useMemo(
    () => cooldown !== 0 || isSendingCode || isCheckingCode,
    [cooldown, isCheckingCode, isSendingCode],
  );

  const completeSignIn = useCallback(async () => {
    setIsCheckingCode(true);

    try {
      const userCredential = await verifyPhoneNumberOTP(phoneNumberOTP);
      const isNewUser = userCredential?.additionalUserInfo?.isNewUser;

      if (isNewUser) {
        console.log("creating new user")
        await createUser.mutateAsync({
          firebaseUid: userCredential.user.uid,
        });
      }

      await auth().currentUser?.reload();

      // TODO: Would be nice if this was refactored to requiresAdditionalDetails
      const completedUserDetailsFlow = await hasUserDetails.mutateAsync();

      completedUserDetailsFlow
        ? router.replace("/(app)/(bottom-tabs)/profile")
        : router.replace("/user-info/welcome");
    } catch (err) {
      setError("Incorrect code. Try again.");
    }

    setIsCheckingCode(false);
  }, [
    createUser,
    hasUserDetails,
    phoneNumberOTP,
    router,
    verifyPhoneNumberOTP,
  ]);

  const resendCode = useCallback(async () => {
    setError(null);
    setIsSendingCode(true);

    try {
      await signInWithPhoneNumber(signUpFlowParams.phoneNumber);
    } catch (err) {
      setError("Error sending code. Try again later.");
    }

    resetCooldown();
    setIsSendingCode(false);
  }, [resetCooldown, signInWithPhoneNumber, signUpFlowParams.phoneNumber]);

  useEffect(() => {
    const sendCode = async () => {
      try {
        await signInWithPhoneNumber(signUpFlowParams.phoneNumber);
      } catch (err) {
        setError("Error sending code. Try again later.");
      }

      setIsSendingCode(false);
    };

    void sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const checkCode = async () => {
      const isValidOTP = schemaValidation.safeParse({ phoneNumberOTP }).success;

      isValidOTP && !isCheckingCode && !codeChecked && (await completeSignIn());
      setCodeChecked(isValidOTP);
    };

    void checkCode();
  }, [phoneNumberOTP, isCheckingCode, codeChecked, completeSignIn]);

  const renderButtonContent = () => {
    if (isCheckingCode || isSendingCode) {
      return <Spinner size="small" color="$background" />;
    }

    if (cooldown !== 0) {
      return (
        <Text fontWeight="600" fontSize={16} color="lightgray">
          Resend in {cooldown}s
        </Text>
      );
    }

    return (
      <Text fontWeight="600" fontSize={16} color="black">
        Send new code
      </Text>
    );
  };

  const buttonDisabled = buttonIsDisabled || isCheckingCode || isSendingCode;
  const onPress = cooldown === 0 && !buttonDisabled ? resendCode : undefined;

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
        <YStack flex={1} space="$8" alignItems="center">
          <Text
            alignSelf="center"
            textAlign="center"
            fontSize={22}
            fontWeight="900"
          >
            Enter your 6 digit code
          </Text>

          <YStack space="$3">
            <PinCodeInput
              ref={pinCodeInputRef}
              length={6}
              onChange={(value) => setPhoneNumberOTP(value)}
              onLayout={() => pinCodeInputRef.current?.focus()}
              containerStyle={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                height: 50, // fixed height for the input container
              }}
              pinInputStyle={{
                width: 36,
                height: "100%",
                marginHorizontal: 4,
                borderColor: "gray",
                justifyContent: "center",
                alignItems: "center",
                borderTopWidth: 0,
                borderLeftWidth: 0,
                borderRightWidth: 0,
                borderWidth: 2,
              }}
              activePinInputStyle={{
                borderColor: "white",
              }}
              textStyle={{
                fontSize: 36,
                color: "white",
                fontWeight: "900",
              }}
            />
          </YStack>

          <Text
            textAlign="center"
            fontSize={14}
            fontWeight="700"
            color={error ? "$red11" : "$gray11"}
          >
            {error
              ? error
              : isSendingCode
                ? "Sending code..."
                : `Verification code sent to ${signUpFlowParams.phoneNumber}`}
          </Text>
        </YStack>

        <View alignSelf="stretch" marginTop="auto">
          <Button
            onPress={onPress}
            borderWidth={0}
            pressStyle={{
              backgroundColor: "$gray12",
            }}
            backgroundColor={buttonDisabled ? "gray" : "white"}
            disabled={buttonDisabled}
          >
            {renderButtonContent()}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// ! This is for testing purposes only, do not use in production
auth().settings.appVerificationDisabledForTesting = true;

export default PhoneNumberOTP;
