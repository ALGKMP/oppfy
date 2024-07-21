import { Pressable, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { UserRoundCheck, UserRoundPlus } from "@tamagui/lucide-icons";
import {
  Button,
  Image,
  ScrollView,
  Text,
  useTheme,
  XStack,
  YStack,
} from "tamagui";

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
  const theme = useTheme();

  const onDone = () =>
    router.replace("/(app)/(bottom-tabs)/(profile)/self-profile");

  return (
    <ScrollView backgroundColor="$background">
      <YStack padding="$4" space="$4">
        <Text fontSize="$6" fontWeight="bold" color="white" textAlign="center">
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
                  width={80}
                  height={80}
                  borderRadius={40}
                />
                <TouchableOpacity
                  onPress={() => console.log(`Add ${user.name}`)}
                  style={{
                    position: "absolute",
                    bottom: -5,
                    right: -5,
                    backgroundColor: "#333",
                    borderRadius: 15,
                    width: 30,
                    height: 30,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 3,
                    borderColor: theme.background.val,
                  }}
                  hitSlop={10}
                >
                  <UserRoundPlus marginLeft={2} size={16} color="white" />
                </TouchableOpacity>
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
