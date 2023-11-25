import React, { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Button, debounce, Input, Text, View, YStack } from "tamagui";
import * as z from "zod";

import { api } from "~/utils/api";

const schemaValidation = z.object({
  firstName: z.string().min(2),
});

const FirstName = () => {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const firstNameInputRef = useRef<TextInput | null>(null);

  const updateUserDetails = api.auth.updateUserDetails.useMutation();

  const firstNameIsValid = useMemo(
    () => schemaValidation.safeParse({ firstName }).success,
    [firstName],
  );

  const onPress = async () => {
    await updateUserDetails.mutateAsync({
      firstName,
    });

    router.replace("/user-info/date-of-birth");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View
        flex={1}
        backgroundColor="black"
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

          <YStack space="$3">
            <Input
              ref={firstNameInputRef}
              value={firstName}
              onChangeText={setFirstName}
              onLayout={() => firstNameInputRef.current?.focus()}
              textAlign="center"
              backgroundColor="transparent"
              height={50}
              fontSize={36}
              fontWeight="900"
              fontFamily="$mono"
              borderWidth={0}
            />
          </YStack>
        </YStack>

        <Button
          height="$4"
          borderRadius="$6"
          onPress={onPress}
          disabled={!firstNameIsValid}
          backgroundColor={firstNameIsValid ? "white" : "gray"}
        >
          <Text
            fontSize={16}
            fontWeight="500"
            color={firstNameIsValid ? "black" : "lightgray"}
          >
            Next
          </Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

export default FirstName;
