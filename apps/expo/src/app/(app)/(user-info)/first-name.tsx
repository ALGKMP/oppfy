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
  Input,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";
import * as z from "zod";

import { api } from "~/utils/api";
import { UnderlineInput } from "~/components/Inputs";

type FormData = z.infer<typeof schemaValidation>;

const schemaValidation = z.object({
  firstName: z
    .string()
    .regex(/^[a-zA-Z]+$/)
    .min(2),
});

const FirstName = () => {
  const router = useRouter();

  const [triggerShake, setTriggerShake] = useState<boolean>(false);

  const firstNameInputRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      firstName: "",
    },
    resolver: zodResolver(schemaValidation),
  });

  const onSubmit = async (data: FormData) => {
    router.push({ params: data, pathname: "date-of-birth" });
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
            What&apos;s your first name?
          </Text>

          <YStack width="100%" alignItems="center" space="$3">
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  textAlign="center"
                  ref={firstNameInputRef}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  onLayout={() => firstNameInputRef.current?.focus()}
                  backgroundColor="transparent"
                  height={50}
                  fontSize={36}
                  fontFamily="$mono"
                  borderWidth={0}
                  fontWeight="900"
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

export default FirstName;
