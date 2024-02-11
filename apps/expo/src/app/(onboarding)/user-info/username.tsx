import React, { useMemo, useRef, useState } from "react";
import type { TextInput } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Button , Input, Text, View, YStack } from "tamagui";
import * as z from "zod";

import { api } from "~/utils/api";

const schemaValidation = z.object({
  username: z.string().min(1),
});

const Username = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const usernameInputRef = useRef<TextInput | null>(null);

  const updateUserDetails = api.auth.updateUserDetails.useMutation();

  const usernameIsValid = useMemo(
    () => schemaValidation.safeParse({ username }).success,
    [username],
  );

  const onPress = async () => {
    await updateUserDetails.mutateAsync({
      username,
    });

    // router.push("/user-info/profile-picture");
    router.replace("/(app)/(bottom-tabs)/profile");
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
            Your favorite username?
          </Text>

          <YStack space="$3">
            <Input
              ref={usernameInputRef}
              value={username}
              onChangeText={setUsername}
              onLayout={() => usernameInputRef.current?.focus()}
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
          onPress={onPress}
          borderWidth={0}
          pressStyle={{
            backgroundColor: "$gray12",
          }}
          backgroundColor={usernameIsValid ? "white" : "gray"}
          disabled={!usernameIsValid}
        >
          <Text
            color={usernameIsValid ? "black" : "lightgray"}
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

export default Username;
