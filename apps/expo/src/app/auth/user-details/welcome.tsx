import React from "react";
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import { Button, Text, View } from "tamagui";

import { api } from "~/utils/api";

const Welcome = () => {
  const router = useRouter();
  const deleteUser = api.auth.deleteUser.useMutation();

  const onCancel = async () => {
    await deleteUser.mutateAsync();
    router.replace("/");
  };

  const onSubmit = () => {
    router.push("/auth/name-input");
  };

  return (
    <View
      flex={1}
      backgroundColor="$background"
      padding="$6"
      justifyContent="space-between"
    >
      <Button onPress={onCancel}>Exit</Button>

      <Text>Welcome</Text>

      <Button
        animation="100ms"
        pressStyle={{
          scale: 0.95,
          backgroundColor: "white",
        }}
        height="$4"
        borderRadius="$8"
        backgroundColor="white"
        color="black"
        fontWeight="500"
        fontSize={16}
        onPress={onSubmit}
      >
        Next
      </Button>
    </View>
  );
};

export default Welcome;
