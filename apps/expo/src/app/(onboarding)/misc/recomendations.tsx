import React, { useState } from "react";
import { Dimensions, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
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

import { BaseScreenView } from "~/components/Views";
import { OnboardingButton } from "~/features/onboarding/components";
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
  // Add more users if needed
];

const { width: screenWidth } = Dimensions.get("window");
const itemWidth = screenWidth / 3 - 24; // Calculate width of each item, considering margin and padding

const AnimatedUserProfile = ({
  user,
  index,
  onUserSelected,
}: {
  user: { userId: string; fullName: string | null; username: string };
  index: number;
  onUserSelected: (userId: string, added: boolean) => void;
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
    const newIsAdded = !isAdded;
    onUserSelected(user.userId, newIsAdded);

    opacity.value = withSequence(
      withTiming(0, { duration: 200 }),
      withDelay(700, withTiming(1, { duration: 200 })),
    );
    checkmarkOpacity.value = withSequence(
      withDelay(200, withTiming(1, { duration: 200 })),
      withDelay(500, withTiming(0, { duration: 200 })),
    );
    setTimeout(() => {
      setIsAdded(newIsAdded);
    }, 1000);
  };

  return (
    <TouchableOpacity onPress={handlePress} disabled={isAdded}>
      <YStack
        width={itemWidth}
        alignItems="center"
        marginBottom="$4"
        marginRight="4" // Add margin to create spacing between items
      >
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
            <UserRoundCheck marginLeft={2} size={40} color="white" />
          </Animated.View>
          <Animated.View
            style={[
              {
                position: "absolute",
                bottom: -5,
                right: -5,
                backgroundColor: isAdded ? "#F214FF" : "#333",
                borderRadius: 15,
                width: 30,
                height: 30,
                marginLeft: 2,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: theme.background.val,
              },
              animatedStyle,
            ]}
          >
            {isAdded ? (
              <UserRoundCheck marginLeft={2} size={16} color="white" />
            ) : (
              <UserRoundPlus marginLeft={2} size={16} color="white" />
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const requiredUsers = 5;

  const { data: recommendations, isLoading } =
    api.contacts.getRecommendationProfilesSelf.useQuery();

  const followMultipleUsersMutation = api.follow.followUsers.useMutation();

  const handleUserSelected = (username: string, selected: boolean) => {
    setSelectedUsers((prev) =>
      selected ? [...prev, username] : prev.filter((u) => u !== username),
    );
  };

  const onDone = async () => {
    // if (selectedUsers.length >= requiredUsers) {
    try {
      void followMultipleUsersMutation.mutateAsync({
        userIds: selectedUsers,
      });

      router.replace("/(app)/(bottom-tabs)/(profile)/self-profile");

      console.log("Followed users:", selectedUsers);
    } catch (error) {
      console.error("Failed to follow users:", error);
      // Handle error (e.g., show an error message to the user)
    }
    // }
  };
  const remainingUsers = Math.max(0, requiredUsers - selectedUsers.length);

  return (
    <BaseScreenView
      flex={1}
      backgroundColor={theme.background.val}
      padding={0}
      safeAreaEdges={["bottom"]}
    >
      <Text
        fontSize="$6"
        fontWeight="bold"
        color="white"
        backgroundColor={"transparent"}
        textAlign="center"
        marginVertical="$4"
      >
        Recommendations
      </Text>
      <FlashList
        data={recommendations}
        estimatedItemSize={itemWidth}
        renderItem={({ item, index }) => (
          <AnimatedUserProfile
            user={item}
            index={index}
            onUserSelected={handleUserSelected}
          />
        )}
        numColumns={3}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        contentContainerStyle={{
          paddingHorizontal: 12,
        }}
      />
      {/*       <OnboardingButton
        onPress={onDone}
        disabled={remainingUsers > 0}
        opacity={remainingUsers > 0 ? 0.5 : 1}
      >
        {remainingUsers > 0
          ? `Add ${remainingUsers} more user${remainingUsers > 1 ? "s" : ""} to continue`
          : "Done"}
      </OnboardingButton> */}
      <OnboardingButton onPress={onDone}>Done</OnboardingButton>
    </BaseScreenView>
  );
};

export default OnboardingRecomendations;
