import React from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button, H1, Text, View, YStack } from "tamagui";
import * as z from "zod";

import { UnderlineInput } from "~/components/Inputs";
import useParams from "~/hooks/useParams";

interface SignUpFlowParams {
  email: string;
  marketing: boolean;
  [Key: string]: string | boolean;
}

const schema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

type FormData = z.infer<typeof schema>;

const EmailInput = () => {
  const router = useRouter();
  const signUpFlowParams = useParams<SignUpFlowParams>();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    router.push({
      pathname: "/auth/verify-email",
      params: { ...data, ...signUpFlowParams },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View
          flex={1}
          backgroundColor="$background"
          padding="$6"
          justifyContent="space-between"
        >
          <YStack space>
            <H1 fontFamily="$silkscreen" fontWeight="700" letterSpacing="$4">
              Moving onto your password
            </H1>

            <YStack space="$3">
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <UnderlineInput
                    height={30}
                    fontSize="$5"
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
                  />
                )}
              />
              {errors.password && (
                <Text fontSize="$2" color="$red11">
                  {errors.password.message}
                </Text>
              )}

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <UnderlineInput
                    height={30}
                    fontSize="$5"
                    underlineColor={errors.confirmPassword ? "$red11" : "white"}
                    placeholder="Confirm Password"
                    placeholderTextColor={
                      errors.confirmPassword ? "$red11" : "$gray10"
                    }
                    focusStyle={{
                      borderBottomColor: errors.confirmPassword
                        ? "$red11"
                        : "white",
                    }}
                    color={errors.confirmPassword ? "$red11" : "white"}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    secureTextEntry={true}
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
              onPress={handleSubmit(onSubmit)}
              height="$5"
              borderRadius="$8"
              backgroundColor="white"
            >
              <Text color="black" fontWeight="500" fontSize={16}>
                Next
              </Text>
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default EmailInput;
