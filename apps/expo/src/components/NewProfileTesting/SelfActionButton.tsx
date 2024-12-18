import { router } from "expo-router";
import { Button, Text, XStack } from "~/components/ui";

const SelfActionButton = () => {
  return (
    <XStack gap="$4">
      <Button
        flex={1}
        borderRadius={50}
        onPress={() => router.push("/edit-profile")}
        borderWidth={1}
        borderColor="white"
        pressStyle={{
          borderWidth: 1,
          borderColor: "white",
        }}
      >
        <Text textAlign="center">Edit Profile</Text>
      </Button>
      
      <Button
        flex={1}
        borderRadius={50}
        onPress={() => router.push("/share-profile")}
        borderWidth={1}
        borderColor="white"
        pressStyle={{
          borderWidth: 1,
          borderColor: "white",
        }}
      >
        <Text textAlign="center">Share Profile</Text>
      </Button>
    </XStack>
  );
};

export default SelfActionButton;
