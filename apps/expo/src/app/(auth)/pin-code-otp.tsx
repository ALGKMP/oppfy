import React, { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import type { TextInput } from "react-native";
import { useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import auth from "@react-native-firebase/auth";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { Check } from "@tamagui/lucide-icons";
import { Controller, set, useForm } from "react-hook-form";
import {
  Button,
  Checkbox,
  H1,
  H2,
  H5,
  Spinner,
  stylePropsText,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";
import * as z from "zod";

import { api } from "~/utils/api";
import { PinCodeInput, UnderlineInput } from "~/components/Inputs";
import withShake from "~/components/withShake";
import useParams from "~/hooks/useParams";

interface SignUpFlowParams {
  phoneNumber: string;
  [Key: string]: string;
}

type FormData = z.infer<typeof schemaValidation>;

const schemaValidation = z.object({
  phoneNumberOTP: z.string().length(6),
});

const ShakingPinCodeInput = withShake(PinCodeInput);

const PhoneNumberOTP = () => {
  const router = useRouter();

  const signUpFlowParams = useParams<SignUpFlowParams>();

  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [isCheckingCode, setIsCheckingCode] = useState<boolean>(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number | null>(null);

  const [triggerShake, setTriggerShake] = useState<boolean>(false);

  const PinCodeInputRef = useRef<TextInput | null>(null);

  const createUserMutation = api.auth.createUser.useMutation();
  const hasUserDetailsMutation = api.auth.hasUserDetails.useMutation();

  const [confirm, setConfirm] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      phoneNumberOTP: "",
    },
    resolver: zodResolver(schemaValidation),
  });

  const onSubmit = useCallback(
    async (data: FormData) => {
      setIsCheckingCode(true);
      try {
        const userCredential = await confirm?.confirm(data.phoneNumberOTP);
        const isNewUser = userCredential?.additionalUserInfo?.isNewUser;

        if (isNewUser) {
          await createUserMutation.mutateAsync({
            firebaseUid: userCredential.user.uid,
          });
        }

        await auth().currentUser?.reload();
        const hasUserDetails = await hasUserDetailsMutation.mutateAsync();
        hasUserDetails
          ? router.replace("/profile")
          : router.replace("/welcome");
      } catch (err) {
        console.log("ERROR: " + err);
        console.log("Error detected, triggering shake");
        setServerError("Incorrect code. Try again.");
        setTriggerShake(true);
      } finally {
        setIsCheckingCode(false);
      }
    },
    [confirm, createUserMutation, hasUserDetailsMutation, router],
  );

  const signInWithPhoneNumber = useCallback(async () => {
    setIsSendingCode(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(
        `+${signUpFlowParams.phoneNumber}`,
      );
      setConfirm(confirmation);
    } catch (err) {
      console.error("Error sending code:", err);
    } finally {
      setIsSendingCode(false);
    }
  }, [signUpFlowParams.phoneNumber]);

  const onSubmitError = useCallback(() => {
    console.log("Error detected, triggering shake");
    setTriggerShake(true);
  }, []);

  const handleShakeComplete = () => {
    setTriggerShake(false);
  };

  useEffect(() => {
    void signInWithPhoneNumber();
  }, [signInWithPhoneNumber, signUpFlowParams.phoneNumber]);

  useEffect(() => {
    const otpValue = getValues().phoneNumberOTP;

    if (otpValue.length === 6 && !isCheckingCode && !hasAutoSubmitted) {
      setHasAutoSubmitted(true);
      void handleSubmit(onSubmit, onSubmitError)();
    } else if (otpValue.length < 6 && hasAutoSubmitted) {
      setHasAutoSubmitted(false); // Reset if the user deletes any character
    }
  }, [
    getValues,
    isCheckingCode,
    hasAutoSubmitted,
    handleSubmit,
    onSubmit,
    onSubmitError,
  ]);

  useEffect(() => {
    if (cooldown === null) return;

    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setCooldown(null);
    }
  }, [cooldown]);

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
            <Controller
              control={control}
              name="phoneNumberOTP"
              render={({ field: { onChange, onBlur, value } }) => {
                return (
                  <ShakingPinCodeInput
                    ref={PinCodeInputRef}
                    length={6}
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    triggerShake={triggerShake}
                    onShakeComplete={handleShakeComplete}
                    containerStyle={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    pinInputStyle={{
                      width: 36,
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
                );
              }}
            />
          </YStack>

          {isSendingCode && (
            <Text
              textAlign="center"
              fontSize={14}
              fontWeight="700"
              color="$gray11"
            >
              Sending code...
            </Text>
          )}

          {!isSendingCode && !errors.phoneNumberOTP && !serverError && (
            <Text
              textAlign="center"
              fontSize={14}
              fontWeight="700"
              color="$gray11"
            >
              Verification code sent to {signUpFlowParams.phoneNumber}
            </Text>
          )}

          {serverError && (
            <Text
              textAlign="center"
              fontSize={14}
              fontWeight="700"
              color="$red11"
            >
              {serverError}
            </Text>
          )}
        </YStack>

        <View alignSelf="stretch" marginTop="auto">
          <Button
            animation="100ms"
            pressStyle={{ scale: 0.95, backgroundColor: "white" }}
            onPress={cooldown === null ? signInWithPhoneNumber : undefined}
            height="$4"
            borderRadius="$6"
            backgroundColor={
              cooldown !== null || isSendingCode || isCheckingCode
                ? "gray"
                : "white"
            }
            disabled={cooldown !== null || isSendingCode || isCheckingCode}
          >
            {cooldown !== null ? (
              <Text fontWeight="500" fontSize={16} color="lightgray">
                Resend in {cooldown}s
              </Text>
            ) : isSendingCode || isCheckingCode ? (
              <Spinner size="large" color="$background" />
            ) : (
              <Text fontWeight="500" fontSize={16} color="black">
                Send new code
              </Text>
            )}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default PhoneNumberOTP;
