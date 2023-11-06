import React, { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import type { TextInput } from "react-native";
import { useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, set, useForm } from "react-hook-form";
import {
  Button,
  Text,
  View,
  YStack,
} from "tamagui";
import * as z from "zod";

import { api } from "~/utils/api";
import { BirthdateInput } from "~/components/Inputs";
import useParams from "~/hooks/useParams";

interface UserDetailsFlowParams {
  firstName: string;
  [Key: string]: string;
}

type FormData = z.infer<typeof schemaValidation>;

const schemaValidation = z.object({
  dateOfBirth: z.string(),
});

const DateOfBirth = () => {
  const router = useRouter();

  const userDetailsFlowParams = useParams<UserDetailsFlowParams>();

  const [triggerShake, setTriggerShake] = useState<boolean>(false);

  const dateOfBirthInputRef = useRef<TextInput | null>(null);

  const updateUserDetails = api.auth.updateUserDetails.useMutation();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      dateOfBirth: "",
    },
    resolver: zodResolver(schemaValidation),
  });

  const onSubmit = async (data: FormData) => {
    console.log("FIRST NAME: " + userDetailsFlowParams.firstName);

    await updateUserDetails.mutateAsync({
      ...userDetailsFlowParams,
      ...data,
    });

    router.replace("/profile");
  };

  const onSubmitError = () => {
    setTriggerShake(true);
  };

  const handleShakeComplete = () => {
    setTriggerShake(false);
  };

  // useEffect(() => {
  //   setTimeout(() => dateOfBirthInputRef.current?.focus(), 500);
  // }, []);

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
            When&apos;s your birthday?
          </Text>

          <YStack width="100%" alignItems="center" space="$3">
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field: { onChange, onBlur, value } }) => (
                <BirthdateInput
                  ref={dateOfBirthInputRef}
                  value={value}
                  onBlur={onBlur}
                  onChange={onChange}
                  onLayout={() => dateOfBirthInputRef.current?.focus()}
                  containerStyle={{
                    position: "relative",
                    alignItems: "center",
                    height: 50,
                  }}
                  inputStyle={{}}
                  charStyle={{
                    fontFamily: "$monospace",
                    textAlign: "center",
                    fontSize: 36,
                    fontWeight: "900",
                  }}
                  typedCharStyle={{}}
                  untypedCharStyle={{
                    color: "$gray6",
                  }}
                  slashCharStyle={{
                    color: "$gray6",
                  }}
                />
              )}
            />
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
            backgroundColor={isValid ? "white" : "gray"}
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

export default DateOfBirth;
