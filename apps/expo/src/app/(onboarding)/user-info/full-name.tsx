import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Button, Input, Text, View, XStack, YStack } from "tamagui";
import * as z from "zod";

import { KeyboardSafeView } from "~/components/SafeViews";
import { api } from "~/utils/api";

const fullNameValidation = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-zA-Z]+([ '-][a-zA-Z]+)*$/);

const FullName = () => {
  const router = useRouter();

  const [fullName, setFullName] = useState("");

  const updateName = api.user.updateFullName.useMutation();

  const isValidFullName = fullNameValidation.safeParse(fullName).success;

  const onSubmit = async () => {
    await updateName.mutateAsync({
      fullName,
    });

    router.push("/user-info/date-of-birth");
  };

  return (
    <KeyboardSafeView>
      <View flex={1} padding="$4" backgroundColor="$background">
        <YStack flex={1} gap="$4">
          <Text fontSize="$8" fontWeight="bold">
            What&apos;s your name?
          </Text>

          <XStack gap="$2">
            <Input
              flex={1}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
            />
          </XStack>
        </YStack>

        <Button
          onPress={onSubmit}
          disabled={!isValidFullName}
          disabledStyle={{ opacity: 0.5 }}
        >
          Welcome
        </Button>
      </View>
    </KeyboardSafeView>
  );
};

export default FullName;
