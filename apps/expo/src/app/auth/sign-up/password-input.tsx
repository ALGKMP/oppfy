import React from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import auth from "@react-native-firebase/auth";
import { Controller, useForm } from "react-hook-form";
import { Button, H1, Text, View, YStack } from "tamagui";
import * as z from "zod";

import { api } from "~/utils/api";
import { isFireBaseError } from "~/utils/firebase";
import { UnderlineInput } from "~/components/Inputs";
import useParams from "~/hooks/useParams";

interface SignUpFlowParams {
  email: string;
  marketing: boolean;
  [Key: string]: string | boolean;
}

const schemaValidation = z
  .object({
    password: z.string().min(8, { message: "Password must be 8 characters" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Password must be 8 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schemaValidation>;

const PasswordInput = () => {
  const router = useRouter();
  const signUpFlowParams = useParams<SignUpFlowParams>();

  const storeAccountFirebase = api.auth.createUser.useMutation();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(schemaValidation),
  });

  // TODO: Auth functionality needs to be moved to the session context
  const onSubmit = async (data: FormData) => {
    try {
      const { user } = await auth().createUserWithEmailAndPassword(
        signUpFlowParams.email,
        data.password,
      );

      await storeAccountFirebase.mutateAsync({
        email: signUpFlowParams.email,
        firebaseUid: user.uid,
      });

      router.push({
        pathname: "/auth/sign-up/verify-email",
        params: { ...data, ...signUpFlowParams },
      });
    } catch (error) {
      if (isFireBaseError(error)) {
        if (error.code === "auth/email-already-in-use") {
          console.error("email already in use");
          setError("confirmPassword", { message: "Email already in use" });
        }
      }
    }
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
                    height={40}
                    fontSize="$5"
                    underlineWidth={1}
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
              {errors.confirmPassword && (
                <Text fontSize="$2" color="$red11">
                  {errors.confirmPassword.message}
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
              height="$4"
              borderRadius="$8"
              backgroundColor="white"
              color="black"
              fontWeight="500"
              fontSize={16}
              onPress={handleSubmit(onSubmit)}
            >
              Next
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default PasswordInput;
