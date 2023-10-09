import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button, Text, View, XStack, YStack } from "tamagui";
import * as z from "zod";
import * as Device from 'expo-device';


import { api } from "~/utils/api";
import { UnderlineInput } from "~/components/Inputs";
import withShake from "~/components/withShake";
import { useSession } from "~/contexts/SessionsContext";

type FormData = z.infer<typeof schemaValidation>;

const schemaValidation = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(6, { message: "Minimum 6 characters" }),
});

const ShakingUnderlineInput = withShake(UnderlineInput);

const SignIn = () => {
  const router = useRouter();
  const { signIn } = useSession();

  const [triggerShake, setTriggerShake] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(schemaValidation),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await signIn(data.email, data.password);
    } catch (error) {
      console.log("Error during sign-in");
      setError("email", { message: "Error during sign-in" });
      setError("password", { message: "Error during sign-in" });
      setTriggerShake(true);
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
      behavior={Device.deviceName === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
        <View
          flex={1}
          backgroundColor="$background"
          padding="$6"
          justifyContent="space-between"
        >
          <YStack space>
            <Text fontSize="$5">Sign In</Text>

            <YStack space="$3">
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ShakingUnderlineInput
                    height={40}
                    fontSize="$5"
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

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ShakingUnderlineInput
                    height={40}
                    fontSize="$5"
                    underlineWidth={1}
                    underlineColor={errors.password ? "$red11" : "white"}
                    placeholder="Password"
                    placeholderTextColor={
                      errors.password ? "$red11" : "$gray10"
                    }
                    focusStyle={{
                      borderBottomColor: errors.password ? "$red11" : "white",
                    }}
                    color={errors.password ? "$red11" : "white"}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    secureTextEntry={true}
                    triggerShake={triggerShake}
                    onShakeComplete={handleShakeComplete}
                  />
                )}
              />
              {errors.password && (
                <Text fontSize="$2" color="$red11">
                  {errors.password.message}
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
              borderRadius="$8"
              backgroundColor={isValid ? "white" : "gray"}
              disabled={!isValid}
            >
              <Text
                color={isValid ? "black" : "lightgray"}
                fontWeight="500"
                fontSize={16}
              >
                Sign In
              </Text>
            </Button>
          </View>
        </View>
    </KeyboardAvoidingView>
  );
};

export default SignIn;
