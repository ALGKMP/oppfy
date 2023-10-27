import React from "react";
import { useRouter } from "expo-router";
import { Button, H2, Text, View, YStack } from "tamagui";
import { api } from "~/utils/api";

import { useSession } from "~/contexts/SessionsContext";

const Welcome = () => {
  const router = useRouter();

  const onSubmit = () => {
    router.push("first-name");
  };

  return (
    <View
      flex={1}
      backgroundColor="$backgroundStrong"
      padding="$6"
      justifyContent="space-between"
    >
      <YStack space>
        <H2>Welcome</H2>
      </YStack>

      <View alignSelf="stretch" marginTop="auto">
        <Button
          animation="100ms"
          pressStyle={{
            scale: 0.95,
            backgroundColor: "white",
          }}
          onPress={onSubmit}
          height="$4"
          borderRadius="$6"
          backgroundColor="white"
        >
          <Text color="black" fontWeight="500" fontSize={16}>
            Next
          </Text>
        </Button>
      </View>
    </View>
  );
};

export default Welcome;
