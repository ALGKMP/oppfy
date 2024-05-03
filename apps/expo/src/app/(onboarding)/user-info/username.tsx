import React, { useState } from "react";
import { useRouter } from "expo-router";
import { TRPCClientError } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { Button, Input, Text, View, XStack, YStack } from "tamagui";

import { sharedValidators } from "@acme/validators";

import { KeyboardSafeView } from "~/components/SafeViews";
import { api, isTRPCClientError } from "~/utils/api";

enum Error {
  USERNAME_TAKEN = "Username is already taken.",
}

const Username = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [error, setError] = useState<Error | null>(null);

  const updateUsername = api.user.updateUsername.useMutation();

  const isValidUsername =
    sharedValidators.user.username.safeParse(username).success;

  const onSubmit = async () => {
    try {
      await updateUsername.mutateAsync({
        username,
      });

      router.push("/user-info/profile-picture");
    } catch (error) {
      if (isTRPCClientError(error)) {
        switch (error.data?.code) {
          case "CONFLICT":
            setError(Error.USERNAME_TAKEN);
            break;
        }
      }
    }
  };

  return (
    <KeyboardSafeView>
      <View flex={1} padding="$4" backgroundColor="$background">
        <YStack flex={1} gap="$4">
          <Text fontSize="$8" fontWeight="bold">
            Pick a username?
          </Text>

          <XStack gap="$2">
            <Input
              flex={1}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              autoFocus
            />
          </XStack>
          {error && <Text color="$red9">{error}</Text>}
        </YStack>

        <Button
          onPress={onSubmit}
          disabled={!isValidUsername}
          disabledStyle={{ opacity: 0.5 }}
        >
          Continue
        </Button>
      </View>
    </KeyboardSafeView>
  );
};

export default Username;
