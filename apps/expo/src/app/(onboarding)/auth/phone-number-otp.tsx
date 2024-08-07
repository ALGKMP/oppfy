import React, { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import auth from "@react-native-firebase/auth";
import { H1, styled, Text, View, XStack, YStack } from "tamagui";

import { sharedValidators } from "@oppfy/validators";

import { BaseScreenView, KeyboardSafeView } from "~/components/Views";
import { useSession } from "~/contexts/SessionContext";
import {
  BoldText,
  DisclaimerText,
  OnboardingButton,
} from "~/features/onboarding/components";
import { api } from "~/utils/api";

// ! This is for testing purposes only, do not use in production
// auth().settings.appVerificationDisabledForTesting = true;

enum Error {
  INCORRECT_CODE = "Incorrect code. Try again.",
  ERROR_SENDING_CODE = "Error sending code. Try again later.",
  UNKNOWN_ERROR = "An unknown error occurred. Please try again later.",
}

const PhoneNumberOTP = () => {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();

  const { verifyPhoneNumberOTP } = useSession();

  const [phoneNumberOTP, setPhoneNumberOTP] = useState("");
  const [error, setError] = useState<Error | null>(null);

  const createUser = api.user.createUser.useMutation();
  const userOnboardingCompletedMutation =
    api.user.checkOnboardingComplete.useMutation();

  const isValidPhoneNumberOTP = useMemo(
    () =>
      sharedValidators.user.phoneNumberOTP.safeParse(phoneNumberOTP).success,
    [phoneNumberOTP],
  );

  const handleNewUser = async (userId: string) => {
    if (!phoneNumber) {
      setError(Error.UNKNOWN_ERROR);
      return;
    }

    console.log("truign this");

    await createUser.mutateAsync({
      userId,
      phoneNumber,
    });

    router.replace("/user-info/welcome");
  };

  const handleExistingUser = async () => {
    const userOnboardingCompleted =
      await userOnboardingCompletedMutation.mutateAsync();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    userOnboardingCompleted
      ? router.replace("/(app)/(bottom-tabs)/(home)")
      : router.replace("/user-info/welcome");
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

    isNewUser ? await handleNewUser(userId) : await handleExistingUser();
  };

  return (
    <KeyboardSafeView>
      <BaseScreenView
        safeAreaEdges={["bottom"]}
        backgroundColor="$background"
        paddingBottom={0}
        paddingHorizontal={0}
      >
        <YStack flex={1} justifyContent="space-between">
          <YStack paddingHorizontal="$4" gap="$6">
            <H1 textAlign="center">Enter your{"\n"}verification code</H1>

            <OTPInput
              value={phoneNumberOTP}
              onChange={(value) => {
                setPhoneNumberOTP(value);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            />

            {error ? (
              <DisclaimerText color="$red9">{error}</DisclaimerText>
            ) : (
              <DisclaimerText>
                Verification code sent to <BoldText>{phoneNumber}</BoldText>
              </DisclaimerText>
            )}
          </YStack>

          <OnboardingButton
            onPress={onSubmit}
            disabled={!isValidPhoneNumberOTP}
          >
            Verify Code
          </OnboardingButton>
        </YStack>
      </BaseScreenView>
    </KeyboardSafeView>
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
        <XStack justifyContent="space-between">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <OTPBox
              key={index}
              {...(focused &&
                index === value.length && {
                  backgroundColor: "$gray4",
                })}
            >
              <Text fontSize="$7" fontWeight="bold" color="$color">
                {value[index] ?? ""}
              </Text>
              {focused && index === value.length && (
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
