import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Button, Text, View, YStack } from "tamagui";
import * as z from "zod";

import { BirthdateInput } from "~/components/Inputs";
import useParams from "~/hooks/useParams";
import { api } from "~/utils/api";

const schemaValidation = z.object({
  dateOfBirth: z.string().length(8),
});

const DateOfBirth = () => {
  const router = useRouter();

  const [dateOfBirth, setDateOfBirth] = useState("");
  const dateOfBirthInputRef = useRef<TextInput | null>(null);

  const updateUserDetails = api.auth.updateUserDetails.useMutation();

  const dataOfBirthIsValid = useMemo(
    () => schemaValidation.safeParse({ dateOfBirth }).success,
    [dateOfBirth],
  );

  const onPress = async () => {
    await updateUserDetails.mutateAsync({
      dateOfBirth,
    });

    router.replace("/(app)/(bottom-tabs)/profile");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View
        flex={1}
        padding="$6"
        backgroundColor="black"
        justifyContent="space-between"
      >
        <YStack flex={1} space="$8" alignItems="center">
          <Text
            fontSize={22}
            fontWeight="900"
            alignSelf="center"
            textAlign="center"
          >
            When's your birthday?
          </Text>

          <YStack space="$3">
            <BirthdateInput
              ref={dateOfBirthInputRef}
              value={dateOfBirth}
              onBlur={() => {}}
              onChange={(value) => setDateOfBirth(value)}
              onLayout={() => dateOfBirthInputRef.current?.focus()}
              containerStyle={{
                position: "relative",
                alignItems: "center",
                height: 50,
              }}
              inputStyle={{}}
              charStyle={{
                fontFamily: "$chivoMono",
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
          </YStack>
        </YStack>

        <Button
          onPress={onPress}
          borderWidth={0}
          pressStyle={{
            backgroundColor: "$gray12",
          }}
          backgroundColor={dataOfBirthIsValid ? "white" : "gray"}
          disabled={!dataOfBirthIsValid}
        >
          <Text
            color={dataOfBirthIsValid ? "black" : "lightgray"}
            fontWeight="600"
            fontSize={16}
          >
            Next
          </Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

export default DateOfBirth;
