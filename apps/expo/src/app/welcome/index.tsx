import { useRouter } from "expo-router";
import React from "react";
import { Button, H2, Text, View, YStack } from "tamagui";

const Welcome = () => {
  const router = useRouter();

  const onSubmit = () => {
    router.push("/user-details/first-name")
  };

  return (
    <View
      flex={1}
      backgroundColor="$background"
      padding="$6"
      justifyContent="space-between"
    >
      <YStack space>
        <H2
          fontFamily="$heading"
          fontWeight="700"
          letterSpacing="$5"
          lineHeight="$5"
        >
          Welcome
        </H2>
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
          borderRadius="$8"
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
