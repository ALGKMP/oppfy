import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "@tamagui/lucide-icons";
import { Controller, set, useForm } from "react-hook-form";
import {
  Button,
  Checkbox,
  H1,
  H2,
  H5,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";
import * as z from "zod";

import { api } from "~/utils/api";
import { UnderlineInput } from "~/components/Inputs";
import withShake from "~/components/withShake";
import { TextInput } from "react-native-gesture-handler";

type FormData = z.infer<typeof schemaValidation>;

const schemaValidation = z.object({
  email: z.string().email({ message: "Invalid email" }),
  marketing: z.boolean(),
});

const ShakingUnderlineInput = withShake(UnderlineInput);

const EmailInput = () => {
  const router = useRouter();

  const emailInUse = api.auth.emailInUse.useMutation();

  const [triggerShake, setTriggerShake] = useState<boolean>(false);

  const emailInputRef = useRef<TextInput>(null); 

  // useEffect(() => {
  //   if (emailInputRef.current) {
  //     emailInputRef.current.focus(); 
  //   }
  // }, []);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      email: "",
      marketing: false,
    },
    resolver: zodResolver(schemaValidation),
  });

  // todo: instead of checking if email is already in use
  // check if the email is verified
  // if verified: show email already in use error
  // else: move to email verification screen
  const onSubmit = async (data: FormData) => {
    try {
      const u = await emailInUse.mutateAsync(data.email);

      if (u) {
        console.log("email already in use");
        setError("email", { message: "Email already in use" });
        setTriggerShake(true);
        return;
      }

      router.push({ params: data, pathname: "auth/sign-up/password-input" });
    } catch (error) {
      console.log("email already in use");
      setError("email", { message: "Email already in use" });
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
        backgroundColor="$background"
        padding="$6"
        justifyContent="space-between"
      >
        <YStack space>
          <H2
            fontFamily="$heading"
            fontWeight="700"
            letterSpacing="$5"
            lineHeight="$5"
          >
            Lets start with your email
          </H2>

          <YStack space="$3">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <ShakingUnderlineInput
                  height={40}
                  // fontSize="$5"
                 ref={emailInputRef}
                  underlineWidth={1}
                  underlineColor={errors.email ? "$red11" : "white"}
                  placeholder="Email address"
                  placeholderTextColor={errors.email ? "$red11" : "$gray10"}
                  focusStyle={{
                    borderBottomColor: errors.email ? "$red11" : "white",
                  }}
                  color={errors.email ? "$red11" : "white"}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  triggerShake={triggerShake}
                  onShakeComplete={handleShakeComplete}
                />
              )}
            />
            {errors.email && (
              <Text fontSize="$2" color="$red11">
                {errors.email.message}
              </Text>
            )}

            <XStack alignItems="center" space="$2">
              <Controller
                control={control}
                name="marketing"
                render={({ field: { onChange, value } }) => (
                  <Checkbox
                    size="$4"
                    checked={value}
                    onPress={() => {
                      onChange(!value);
                    }}
                  >
                    <Checkbox.Indicator>
                      <Check />
                    </Checkbox.Indicator>
                  </Checkbox>
                )}
              />

              <Text fontSize="$2">
                Receive marketing communications from{" "}
                <Text fontWeight="700">OPPFY</Text>
              </Text>
            </XStack>
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
            borderRadius="$8"
            backgroundColor={isValid ? "white" : "gray"} // Change background color based on validity
            disabled={!isValid}
          >
            <Text
              color={isValid ? "black" : "lightgray"}
              fontWeight="500"
              fontSize={16}
            >
              Next
            </Text>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default EmailInput;
