import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
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

const AnimatedUserProfile = ({
  user,
  index,
}: {
  user: { fullName: string; username: string };
  index: number;
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const opacity = useSharedValue(1);
  const checkmarkOpacity = useSharedValue(0);
  const theme = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const checkmarkAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: checkmarkOpacity.value,
    };
  });

  const handlePress = () => {
    setIsAdded((prev) => !prev);
    opacity.value = withSequence(
      withTiming(0, { duration: 200 }),
      withDelay(700, withTiming(1, { duration: 200 })),
    );
    checkmarkOpacity.value = withSequence(
      withDelay(200, withTiming(1, { duration: 200 })),
      withDelay(500, withTiming(0, { duration: 200 })),
    );
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <YStack width="100%" alignItems="center" marginBottom="$4">
        <View style={{ position: "relative", width: 80, height: 80 }}>
          <Animated.View style={animatedStyle}>
            <Image
              source={{ uri: `https://picsum.photos/100?random=${index}` }}
              width={80}
              height={80}
              borderRadius={40}
            />
          </Animated.View>
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
              },
              checkmarkAnimatedStyle,
            ]}
          >
            <UserRoundCheck size={40} color="white" />
          </Animated.View>
          <Animated.View
            style={[
              {
                position: "absolute",
                bottom: -5,
                right: -5,
                backgroundColor: isAdded ? "#1a1a1a" : "#333",
                borderRadius: 15,
                width: 30,
                height: 30,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: "black",
              },
              animatedStyle,
            ]}
          >
            {isAdded ? (
              <UserRoundCheck size={16} color="white" />
            ) : (
              <UserRoundPlus size={16} color="white" />
            )}
          </Animated.View>
        </View>
        <Text fontSize="$3" fontWeight="bold" color="white">
          {user.fullName}
        </Text>
        <Text fontSize="$2" color="$gray10">
          {user.username}
        </Text>
      </YStack>
    </TouchableOpacity>
  );
};

const OnboardingRecomendations = () => {
  const theme = useTheme();

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
          <AnimatedUserProfile user={placeholderUsers[0]!} index={0} />
          {/*           {placeholderUsers.map((user, index) => (
            <AnimatedUserProfile key={index} user={user} index={index} />
          ))} */}
        </XStack>
        <Button onPress={onDone}>Done</Button>
      </YStack>
    </ScrollView>
  );
};

export default OnboardingRecomendations;
