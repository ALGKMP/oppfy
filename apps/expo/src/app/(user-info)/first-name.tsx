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

type FormData = z.infer<typeof schemaValidation>;

const schemaValidation = z.object({
  firstName: z.string().min(1, { message: "Please enter a name" }),
});

const ShakingUnderlineInput = withShake(UnderlineInput);

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

  useEffect(() => {
    if (firstNameInputRef.current) {
      firstNameInputRef.current.focus();
    }
  }, []);

  const onSubmit = async (data: FormData) => {
    router.push({ params: data, pathname: "/user-details/date-of-birth" });
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
          <H2>First name</H2>

          <YStack space="$3">
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <ShakingUnderlineInput
                  height={40}
                  // fontSize="$5"
                  ref={firstNameInputRef}
                  underlineWidth={1}
                  underlineColor={errors.firstName ? "$red11" : "white"}
                  placeholder="First name"
                  placeholderTextColor={errors.firstName ? "$red11" : "$gray10"}
                  focusStyle={{
                    borderBottomColor: errors.firstName ? "$red11" : "white",
                  }}
                  color={errors.firstName ? "$red11" : "white"}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  triggerShake={triggerShake}
                  onShakeComplete={handleShakeComplete}
                />
              )}
            />
            {errors.firstName && (
              <Text fontSize="$2" color="$red11">
                {errors.firstName.message}
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

export default FirstName;
