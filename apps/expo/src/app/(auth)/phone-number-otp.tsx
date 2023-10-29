import React, { useEffect, useRef, useState } from "react";
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
  phoneNumberOTP: z.string().length(6, { message: "Invalid OTP" }),
});

const ShakingUnderlineInput = withShake(UnderlineInput);

const PhoneNumberOTP = () => {
  const router = useRouter();

  const signUpFlowParams = useParams<SignUpFlowParams>();

  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [isCheckingCode, setIsCheckingCode] = useState<boolean>(false);

  const [triggerShake, setTriggerShake] = useState<boolean>(false);

  const phoneNumberOTPInputRef = useRef<TextInput | null>(null);

  const createUserMutation = api.auth.createUser.useMutation();
  const hasUserDetailsMutation = api.auth.hasUserDetails.useMutation();

  const [confirm, setConfirm] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      phoneNumberOTP: "",
    },
    resolver: zodResolver(schemaValidation),
  });

  useEffect(() => {
    const signInWithPhoneNumber = async () => {
      try {
        setIsSendingCode(true);

        const confirmation = await auth().signInWithPhoneNumber(
          `+${signUpFlowParams.phoneNumber}`,
        );
        setConfirm(confirmation);
      } catch (err) {
        console.error("Error sending code:", err);
      } finally {
        setIsSendingCode(false);
      }
    };

    void signInWithPhoneNumber();
  }, [signUpFlowParams.phoneNumber]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsCheckingCode(true); // Start the spinner when checking the code

      const userCredential = await confirm?.confirm(data.phoneNumberOTP);

      if (userCredential?.additionalUserInfo?.isNewUser) {
        await createUserMutation.mutateAsync({
          firebaseUid: userCredential.user.uid,
        });
      }

      // TODO: temp solution to instantly update user object, once moved into the session provider we will use the returned userCredential to get the updated [@user] info
      await auth().currentUser?.reload();

      const hasUserDetails = await hasUserDetailsMutation.mutateAsync();

      hasUserDetails ? router.replace("/profile") : router.replace("/welcome");
    } catch (err) {
      console.log("ERROR: " + err);
      console.log("Error detected, triggering shake");
      setError("phoneNumberOTP", { message: "Invalid code" });
      setTriggerShake(true);
    } finally {
      setIsCheckingCode(false); // Stop the spinner once the check is complete or there's an error
    }
  };

  const onSubmitError = () => {
    console.log("Error detected, triggering shake");
    setTriggerShake(true);
  };

  const handleShakeComplete = () => {
    setTriggerShake(false);
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
        <YStack space>
          <H2>Enter otp code</H2>

          <PinCodeInput />

          <YStack space="$3">
            <Controller
              control={control}
              name="phoneNumberOTP"
              render={({ field: { onChange, onBlur, value } }) => (
                <ShakingUnderlineInput
                  height={40}
                  ref={phoneNumberOTPInputRef}
                  onLayout={() => phoneNumberOTPInputRef.current?.focus()}
                  underlineWidth={1}
                  underlineColor={errors.phoneNumberOTP ? "$red11" : "white"}
                  placeholder="OTP Code"
                  placeholderTextColor={
                    errors.phoneNumberOTP ? "$red11" : "$gray10"
                  }
                  focusStyle={{
                    borderBottomColor: errors.phoneNumberOTP
                      ? "$red11"
                      : "white",
                  }}
                  color={errors.phoneNumberOTP ? "$red11" : "white"}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  triggerShake={triggerShake}
                  onShakeComplete={handleShakeComplete}
                />
              )}
            />
            {errors.phoneNumberOTP && (
              <Text fontSize="$2" color="$red11">
                {errors.phoneNumberOTP.message}
              </Text>
            )}
          </YStack>
        </YStack>

        <View alignSelf="stretch" marginTop="auto">
          <Button
            animation="100ms"
            pressStyle={{
              scale: 0.95,
              backgroundColor: "white",
            }}
            onPress={handleSubmit(onSubmit, onSubmitError)}
            height="$4"
            borderRadius="$6"
            // backgroundColor={isValid ? "white" : "gray"} // Change background color based on validity
            backgroundColor={
              !isValid || isSendingCode || isCheckingCode ? "gray" : "white"
            }
            disabled={!isValid || isSendingCode || isCheckingCode}
          >
            {isSendingCode || isCheckingCode ? (
              <Spinner size="large" color="$background" />
            ) : (
              <Text
                color={isValid ? "black" : "lightgray"}
                fontWeight="500"
                fontSize={16}
              >
                Next
              </Text>
            )}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default PhoneNumberOTP;
