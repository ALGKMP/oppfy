import React from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "@tamagui/lucide-icons";
import { Controller, useForm } from "react-hook-form";
import { Button, Checkbox, H1, Text, View, XStack, YStack } from "tamagui";
import auth from "@react-native-firebase/auth";
import * as z from "zod";

import { UnderlineInput } from "~/components/Inputs";
import { isFireBaseError } from "~/utils/firebase";


const schemaValidation = z.object({
  email: z.string().email({ message: "Invalid email" }),
  marketing: z.boolean(),
});

type FormData = z.infer<typeof schemaValidation>;

const EmailInput = () => {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      marketing: false,
    },
    resolver: zodResolver(schemaValidation),
  });

  const onSubmit = async (data: FormData) => {
    try {
      auth().fetchSignInMethodsForEmail(data.email).then((signInMethods) => {
        if (signInMethods.length === 0) {
            // Email is not registered
            console.log("email not in use")
            router.push({ pathname: "auth/password-input", params: data });
        } else {
            // Email is registered
            console.log("email already in use")
        }
    }).catch((error) => {
        console.error("Error checking email:", error);
    });
    


    } 
    catch(error) {
      if (isFireBaseError(error)) {
        if (error.code === "auth/invalid-email") {
          console.log("email already in use");
          setError("email", { message: "Email already in use" });
      }
    }
  };
}
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
              Lets start with your email
            </H1>

            <YStack space="$3">
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <UnderlineInput
                    height={30}
                    fontSize="$5"
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
