import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import type { TextInput } from "react-native";
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
import useParams from "~/hooks/useParams";

interface UserDetailsFlowParams {
  firstName: string;
  [Key: string]: string;
}

type FormData = z.infer<typeof schemaValidation>;

const schemaValidation = z.object({
  dateOfBirth: z.string(),
});

const ShakingUnderlineInput = withShake(UnderlineInput);

const DateOfBirth = () => {
  const router = useRouter();

  const userDetailsFlowParams = useParams<UserDetailsFlowParams>();

  const [triggerShake, setTriggerShake] = useState<boolean>(false);

  const dateOfBirthInputRef = useRef<TextInput>(null);

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

  useEffect(() => {
    if (dateOfBirthInputRef.current) {
      dateOfBirthInputRef.current.focus();
    }
  }, []);

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
          <H2>Date of birth</H2>

          <YStack space="$3">
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field: { onChange, onBlur, value } }) => (
                <ShakingUnderlineInput
                  height={40}
                  // fontSize="$5"
                  ref={dateOfBirthInputRef}
                  underlineWidth={1}
                  underlineColor={errors.dateOfBirth ? "$red11" : "white"}
                  placeholder="Date of birth"
                  placeholderTextColor={
                    errors.dateOfBirth ? "$red11" : "$gray10"
                  }
                  focusStyle={{
                    borderBottomColor: errors.dateOfBirth ? "$red11" : "white",
                  }}
                  color={errors.dateOfBirth ? "$red11" : "white"}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  triggerShake={triggerShake}
                  onShakeComplete={handleShakeComplete}
                />
              )}
            />
            {errors.dateOfBirth && (
              <Text fontSize="$2" color="$red11">
                {errors.dateOfBirth.message}
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
              Next
            </Text>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default DateOfBirth;
