import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import DatePicker from "react-native-date-picker";
import { useRouter } from "expo-router";
import { Button, Input, Text, View, XStack, YStack } from "tamagui";

import { sharedValidators } from "@acme/validators";

import { KeyboardSafeView } from "~/components/Views";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const DateOfBirth = () => {
  const router = useRouter();

  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);

  const updateDateOfBirth = api.user.updateDateOfBirth.useMutation();

  const isValidDateOfBirth =
    sharedValidators.user.dateOfBirth.safeParse(dateOfBirth).success;

  const onSubmit = async () => {
    if (dateOfBirth === null) return;

    await updateDateOfBirth.mutateAsync({
      dateOfBirth,
    });

    router.push("/user-info/username");
  };

  return (
    <KeyboardSafeView>
      <BaseScreenView safeAreaEdges={["bottom"]}>
        <YStack flex={1} gap="$4">
          <Text fontSize="$8" fontWeight="bold">
            When&apos;s your birthday?
          </Text>

          <XStack gap="$2">
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setOpen(true)}>
              <View pointerEvents="none">
                <Input placeholder="Birthdate">
                  {dateOfBirth?.toLocaleDateString()}
                </Input>
              </View>
            </TouchableOpacity>
          </XStack>

          <Text color="$gray9">You must be 13+ to use OPPFY.</Text>
        </YStack>

        <Button
          onPress={onSubmit}
          disabled={!isValidDateOfBirth}
          disabledStyle={{ opacity: 0.5 }}
        >
          Continue
        </Button>

        <DatePicker
          modal
          mode="date"
          open={open}
          date={dateOfBirth ? dateOfBirth : new Date()}
          onConfirm={(date) => {
            setOpen(false);
            setDateOfBirth(date);
          }}
          onCancel={() => {
            setOpen(false);
          }}
        />
      </BaseScreenView>
    </KeyboardSafeView>
  );
};

export default DateOfBirth;
