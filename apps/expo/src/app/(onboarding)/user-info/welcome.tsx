import React from "react";
import { useRouter } from "expo-router";
import { Button, H2, Text, View, YStack } from "tamagui";

const Welcome = () => {
  const router = useRouter();

  const onPress = () => router.push("/user-info/first-name");

  return (
    <View
      flex={1}
      backgroundColor="black"
      padding="$6"
      justifyContent="space-between"
    >
      <YStack space>
        <H2>Welcome</H2>
      </YStack>

      <View>
        <Button
          onPress={onPress}
          borderWidth={0}
          backgroundColor="white"
          pressStyle={{
            backgroundColor: "$gray12",
          }}
        >
          <Text color="black" fontWeight="600" fontSize={16}>
            Welcome
          </Text>
        </Button>
      </View>
    </View>
  );
};

export default Welcome;
