import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Button, Input, Text, XStack, YStack } from "tamagui";

import { sharedValidators } from "@acme/validators";

import { KeyboardSafeView } from "~/components/SafeViews";
import { ScreenBaseView } from "~/components/Views";
import { api } from "~/utils/api";

const FullName = () => {
  const router = useRouter();

  const [fullName, setFullName] = useState("");

  const updateName = api.user.updateFullName.useMutation();

  const isValidFullName =
    sharedValidators.user.fullName.safeParse(fullName).success;

  const onSubmit = async () => {
    await updateName.mutateAsync({
      fullName,
    });

    router.push("/user-info/date-of-birth");
  };

  return (
    <KeyboardSafeView>
      <ScreenBaseView>
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
              autoFocus
            />
          </XStack>
        </YStack>

        <Button
          onPress={onSubmit}
          disabled={!isValidFullName}
          disabledStyle={{ opacity: 0.5 }}
        >
          Continue
        </Button>
      </ScreenBaseView>
    </KeyboardSafeView>
  );
};

export default FullName;
