import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  SectionList,
  TouchableOpacity,
} from "react-native";
import type { TextInput } from "react-native";
import {
  CountryButton,
  CountryPicker,
  ListHeaderComponentProps,
} from "react-native-country-codes-picker";
import { useRouter } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "@tamagui/lucide-icons";
import { Controller, set, useForm } from "react-hook-form";
// import CountryPicker, {
//   Country,
//   CountryCode,
// } from "react-native-country-picker-modal";
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
import { PhoneNumberInput, UnderlineInput } from "~/components/Inputs";
import withShake from "~/components/withShake";
import { groupedCountries } from "~/data/groupedCountries";

type FormData = z.infer<typeof schemaValidation>;

const schemaValidation = z.object({
  phoneNumber: z.string().min(1, { message: "Invalid number" }),
});

const ShakingUnderlineInput = withShake(UnderlineInput);

const PhoneNumber = () => {
  const router = useRouter();

  const [triggerShake, setTriggerShake] = useState<boolean>(false);

  const phoneNumberInputRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      phoneNumber: "",
    },
    resolver: zodResolver(schemaValidation),
  });

  useEffect(() => {
    if (phoneNumberInputRef.current) {
      phoneNumberInputRef.current.focus();
    }
  }, []);

  const onSubmit = async (data: FormData) => {
    router.push({ params: data, pathname: "phone-number-otp" });
  };

  // Test S3 connection
  // console.log(api.profilePhoto.test.useQuery());

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
        <YStack space>
          <H2>Lets start with your number</H2>

          <PhoneNumberInput
            onChange={(value) => {
              console.log(value);
            }}
          />

          <YStack space="$3">
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <ShakingUnderlineInput
                  height={40}
                  // fontSize="$5"
                  ref={phoneNumberInputRef}
                  underlineWidth={1}
                  underlineColor={errors.phoneNumber ? "$red11" : "white"}
                  placeholder="Phone number"
                  placeholderTextColor={
                    errors.phoneNumber ? "$red11" : "$gray10"
                  }
                  focusStyle={{
                    borderBottomColor: errors.phoneNumber ? "$red11" : "white",
                  }}
                  color={errors.phoneNumber ? "$red11" : "white"}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  triggerShake={triggerShake}
                  onShakeComplete={handleShakeComplete}
                />
              )}
            />
            {errors.phoneNumber && (
              <Text fontSize="$2" color="$red11">
                {errors.phoneNumber.message}
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

export default PhoneNumber;
