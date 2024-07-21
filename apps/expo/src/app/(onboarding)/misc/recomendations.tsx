import { Pressable, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { UserRoundCheck, UserRoundPlus } from "@tamagui/lucide-icons";
import {
  Button,
  Image,
  ScrollView,
  Spacer,
  Text,
  useTheme,
  XStack,
  YStack,
} from "tamagui";

import { api, RouterOutputs } from "~/utils/api";

const placeholderUsers = [
  { fullName: "Michael", username: "michaelyyz" },
  { fullName: "Ben Archer", username: "benarcher" },
  { fullName: "Nebula", username: "nebula1600" },
  { fullName: "kareem", username: "6kaleio" },
  { fullName: "ayaaniqbal", username: "ayaaniqbal" },
  { fullName: "Ali", username: "aliy45" },
  { fullName: "itsalianna", username: "itsaliannaaa" },
  { fullName: "Bautista", username: "bautista12" },
  { fullName: "mckalaaaaa", username: "mckalaaaa" },
  // Add more users if needed
];

type RecomendationProfile =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"][0];

const QuickAddPersonCircle = (props: { profile: RecomendationProfile }) => {
  const { profile } = props;
  return (
    <YStack>
      <Image
        source={{ uri: `https://picsum.photos/100?random=${profile.userId}` }}
        width={80}
        height={80}
        borderRadius={40}
      />
      <Text fontSize="$3" fontWeight="bold" color="white">
        {profile.fullName}
      </Text>
      <Text fontSize="$2" color="$gray10">
        {profile.username}
      </Text>
      <Pressable
        onPress={() => console.log(`Add ${profile.fullName}`)}
        style={{
          backgroundColor: "#333",
          borderRadius: 15,
          width: 30,
          height: 30,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <UserRoundPlus size={16} color="white" />
      </Pressable>
    </YStack>
  );
};

const OnboardingRecomendations = () => {
  const theme = useTheme();

  // get recomendations
  const { data: recommendations, isLoading } =
    api.contacts.getRecommendationProfilesSelf.useQuery();

  const onDone = () =>
    router.replace("/(app)/(bottom-tabs)/(profile)/self-profile");

  return (
    <ScrollView backgroundColor="$background">
      <YStack padding="$4" gap="$4">
        <Text fontSize="$6" fontWeight="bold" color="white" textAlign="center">
          Recommendations
        </Text>
        <XStack flexWrap="wrap">
          {placeholderUsers.map((user, index) => (
            <YStack
              key={index}
              width="33.33%"
              alignItems="center"
              marginBottom="$4"
            >
              {user && (
                <>
                  <YStack position="relative">
                    <Image
                      source={{
                        uri: `https://picsum.photos/100?random=${index}`,
                      }}
                      width={80}
                      height={80}
                      borderRadius={40}
                    />
                    <TouchableOpacity
                      onPress={() => console.log(`Add ${user.fullName}`)}
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
                        borderWidth: 2,
                        borderColor: "black",
                        elevation: 0,
                        shadowOpacity: 0,
                        shadowRadius: 0,
                        shadowOffset: { width: 0, height: 0 },
                      }}
                    >
                      <YStack marginLeft={1} marginTop={1}>
                        <UserRoundPlus size={16} color="white" />
                      </YStack>
                    </TouchableOpacity>
                  </YStack>
                  <Text fontSize="$3" fontWeight="bold" color="white">
                    {user.fullName}
                  </Text>
                  <Text fontSize="$2" color="$gray10">
                    {user.username}
                  </Text>
                </>
              )}
            </YStack>
          ))}
        </XStack>
      </YStack>
    </ScrollView>
  );
};

export default OnboardingRecomendations;
