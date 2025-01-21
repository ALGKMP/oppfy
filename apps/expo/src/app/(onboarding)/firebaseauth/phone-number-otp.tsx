import React, { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import auth from "@react-native-firebase/auth";
import { Paragraph, styled } from "tamagui";

import { sharedValidators } from "@oppfy/validators";

import {
  H2,
  OnboardingButton,
  ScreenView,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import { useSession } from "~/contexts/SessionContext";
import { api } from "~/utils/api";

// ! This is for testing purposes only, do not use in production
auth().settings.appVerificationDisabledForTesting = true;

enum Error {
  INCORRECT_CODE = "Incorrect code. Try again.",
  ERROR_SENDING_CODE = "Error sending code. Try again later.",
  INVALID_PHONE_NUMBER = "Invalid phone number. Please check the number and try again.",
  QUOTA_EXCEEDED = "SMS quota exceeded. Please try again later.",
  CODE_EXPIRED = "The verification code has expired. Please request a new code.",
  MISSING_VERIFICATION_CODE = "Verification code is missing. Please enter the code.",
  NETWORK_REQUEST_FAILED = "Network error. Please check your connection and try again.",
  TOO_MANY_REQUESTS = "Too many attempts. Please try again later.",
  UNKNOWN_ERROR = "An unknown error occurred. Please try again later.",
}

const FirebaseErrorCodes = {
  INVALID_VERIFICATION_CODE: "auth/invalid-verification-code",
  TOO_MANY_REQUESTS: "auth/too-many-requests",
  INVALID_PHONE_NUMBER: "auth/invalid-phone-number",
  QUOTA_EXCEEDED: "auth/quota-exceeded",
  CODE_EXPIRED: "auth/code-expired",
  MISSING_VERIFICATION_CODE: "auth/missing-verification-code",
  NETWORK_REQUEST_FAILED: "auth/network-request-failed",
};

const isFirebaseError = (
  err: unknown,
): err is FirebaseAuthTypes.NativeFirebaseAuthError => {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as FirebaseAuthTypes.NativeFirebaseAuthError).code ===
      "string" &&
    (err as FirebaseAuthTypes.NativeFirebaseAuthError).code.startsWith("auth/")
  );
};

const PhoneNumberOTP = () => {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();

  const { verifyPhoneNumberOTP } = useSession();

  const [phoneNumberOTP, setPhoneNumberOTP] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createUser = api.user.createUser.useMutation();
  const userOnboardingCompletedMutation =
    api.user.checkOnboardingComplete.useMutation();

  const isValidPhoneNumberOTP = useMemo(
    () =>
      sharedValidators.user.phoneNumberOTP.safeParse(phoneNumberOTP).success,
    [phoneNumberOTP],
  );

  const handleNewUser = async (userId: string) => {
    console.log("handleNewUser", userId, phoneNumber);

    if (!phoneNumber) {
      setError(Error.UNKNOWN_ERROR);
      return;
    }

    await createUser.mutateAsync({
      userId,
      phoneNumber,
    });

    router.replace("/user-info/welcome");
  };

  const handleExistingUser = async () => {
    console.log("handleExistingUser", phoneNumber);
    const userOnboardingCompleted =
      await userOnboardingCompletedMutation.mutateAsync();

    userOnboardingCompleted
      ? router.replace("/(app)/(bottom-tabs)/(home)")
      : router.replace("/user-info/welcome");
  };

  const onSubmit = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsLoading(true);
    setError(null);

    let userCredential: FirebaseAuthTypes.UserCredential | null = null;

    try {
      userCredential = await verifyPhoneNumberOTP(phoneNumberOTP);
    } catch (error) {
      if (!isFirebaseError(error)) {
        setError(Error.UNKNOWN_ERROR);
        return;
      }

      switch (error.code) {
        case FirebaseErrorCodes.INVALID_VERIFICATION_CODE:
          setError(Error.INCORRECT_CODE);
          break;
        case FirebaseErrorCodes.TOO_MANY_REQUESTS:
          setError(Error.TOO_MANY_REQUESTS);
          break;
        case FirebaseErrorCodes.INVALID_PHONE_NUMBER:
          setError(Error.INVALID_PHONE_NUMBER);
          break;
        case FirebaseErrorCodes.QUOTA_EXCEEDED:
          setError(Error.QUOTA_EXCEEDED);
          break;
        case FirebaseErrorCodes.CODE_EXPIRED:
          setError(Error.CODE_EXPIRED);
          break;
        case FirebaseErrorCodes.MISSING_VERIFICATION_CODE:
          setError(Error.MISSING_VERIFICATION_CODE);
          break;
        case FirebaseErrorCodes.NETWORK_REQUEST_FAILED:
          setError(Error.NETWORK_REQUEST_FAILED);
          break;
      }

      setIsLoading(false);
    }

    if (!userCredential) {
      return;
    }

    const isNewUser = userCredential.additionalUserInfo?.isNewUser;
    const userId = userCredential.user.uid;

    if (!userId) {
      setError(Error.UNKNOWN_ERROR);
      return;
    }

    isNewUser ? await handleNewUser(userId) : await handleExistingUser();
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
        <H2 textAlign="center">Enter your{"\n"}verification code</H2>

        <OTPInput
          value={phoneNumberOTP}
          onChange={(value) => {
            setPhoneNumberOTP(value);
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        />

        {error ? (
          <Paragraph size="$5" color="$red9" textAlign="center">
            {error}
          </Paragraph>
        ) : (
          <Paragraph size="$5" color="$gray11" textAlign="center">
            Verification code sent to{" "}
            <Text fontWeight="bold">{phoneNumber}</Text>
          </Paragraph>
        )}
      </YStack>

      <OnboardingButton
        marginHorizontal="$-4"
        onPress={onSubmit}
        disabled={!isValidPhoneNumberOTP || isLoading}
      >
        {isLoading ? <Spinner /> : "Verify Code"}
      </OnboardingButton>
    </ScreenView>
  );
};

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
}

const OTPInput = ({ value, onChange }: OTPInputProps) => {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const handleChangeText = useCallback(
    (text: string) => {
      const newValue = text.replace(/[^0-9]/g, "").slice(0, 6);
      onChange(newValue);
    },
    [onChange],
  );

  const handlePress = useCallback(() => {
    inputRef.current?.focus();
    setFocused(true);
  }, []);

  return (
    <TouchableOpacity activeOpacity={1} onPress={handlePress}>
      <View>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          keyboardType="number-pad"
          maxLength={6}
          style={styles.hiddenInput}
          autoFocus={true}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <XStack width="100%" justifyContent="space-between">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <OTPBox
              key={index}
              {...(focused &&
                (index === value.length ||
                  (value.length === 6 && index === 5)) && {
                  backgroundColor: "$gray4",
                })}
            >
              <Text fontSize="$7" fontWeight="bold" color="$color">
                {value[index] ?? ""}
              </Text>
              {focused &&
                (index === value.length ||
                  (value.length === 6 && index === 5)) && (
                  <View style={styles.cursor} />
                )}
            </OTPBox>
          ))}
        </XStack>
      </View>
    </TouchableOpacity>
  );
};

const OTPBox = styled(View, {
  width: 50,
  height: 60,
  borderRadius: "$6",
  backgroundColor: "$gray3",
  justifyContent: "center",
  alignItems: "center",
  shadowColor: "$gray6",
  shadowRadius: 5,
  shadowOpacity: 0.2,
});

const styles = StyleSheet.create({
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  cursor: {
    width: 2,
    height: 32,
    backgroundColor: "$color",
    position: "absolute",
  },
});

export default PhoneNumberOTP;
