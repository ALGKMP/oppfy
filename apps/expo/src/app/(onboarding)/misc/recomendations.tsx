import { Pressable } from "react-native";
import { router } from "expo-router";
import { UserRoundCheck, UserRoundPlus } from "@tamagui/lucide-icons";
import { Button, Image, ScrollView, Text, XStack, YStack } from "tamagui";

const placeholderUsers = [
  { name: "Michael", username: "michaelyyz" },
  { name: "Ben Archer", username: "benarcher" },
  { name: "Nebula", username: "nebula1600" },
  { name: "kareem", username: "6kaleio" },
  { name: "ayaaniqbal", username: "ayaaniqbal" },
  { name: "Ali", username: "aliy45" },
  { name: "itsalianna", username: "itsaliannaaa" },
  { name: "Bautista", username: "bautista12" },
  { name: "mckalaaaaa", username: "mckalaaaa" },
  // Add more users if needed
];

const OnboardingRecomendations = () => {
  const onDone = () =>
    router.replace("/(app)/(bottom-tabs)/(profile)/self-profile");

  return (
    <ScrollView backgroundColor="black">
      <YStack padding="$4" space="$4">
        <Text fontSize="$6" fontWeight="bold" color="white">
          Recommendations
        </Text>
        <XStack flexWrap="wrap" justifyContent="space-between">
          {placeholderUsers.map((user, index) => (
            <YStack
              key={index}
              width="32%"
              alignItems="center"
              marginBottom="$4"
            >
              <YStack position="relative">
                <Image
                  source={{ uri: `https://picsum.photos/100?random=${index}` }}
                  width={100}
                  height={100}
                  borderRadius={50}
                />
                <Button
                  position="absolute"
                  bottom={0}
                  right={0}
                  backgroundColor="$gray8"
                  borderRadius={12}
                  padding={4}
                  onPress={() => console.log(`Add ${user.name}`)}
                >
                  <UserRoundPlus size={16} color="white" />
                </Button>
              </YStack>
              <Text fontSize="$3" fontWeight="bold" color="white">
                {user.name}
              </Text>
              <Text fontSize="$2" color="$gray10">
                {user.username}
              </Text>
            </YStack>
          ))}
        </XStack>
      </YStack>
    </ScrollView>
  );
};

export default OnboardingRecomendations;
