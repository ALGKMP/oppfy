import React from "react";
import { Dimensions, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import {
  ChevronLeft,
  UserRoundCheck,
  UserRoundPlus,
} from "@tamagui/lucide-icons";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { api } from "~/utils/api";

const { width: screenWidth } = Dimensions.get("window");
const itemWidth = screenWidth / 3 - 24; // Calculate width of each item, considering margin and padding

interface User {
  userId: string;
  profileId: string;
  privacy: "public" | "private";
  username: string;
  name: string | null;
  profilePictureUrl: string | null;
  relationshipStatus: "notFollowing" | "following" | "requested";
}

interface UserProfileProps {
  user: User;
  index: number;
  onUserSelected: (userId: string, added: boolean) => void;
  isAdded: boolean;
}

const AnimatedUserProfile = ({
  user,
  onUserSelected,
  index: _index,
  isAdded,
}: UserProfileProps) => {
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
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <YStack
        width={itemWidth}
        alignItems="center"
        marginBottom="$4"
        marginRight="4" // Add margin to create spacing between items
      >
        <View style={{ position: "relative", width: 80, height: 80 }}>
          <Animated.View style={animatedStyle}>
            <Image
              source={user.profilePictureUrl ?? DefaultProfilePicture}
              style={{ width: 80, height: 80, borderRadius: 40 }}
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
          {user.name}
        </Text>
        <Text fontSize="$2" color="$gray10">
          {user.username}
        </Text>
      </YStack>
    </TouchableOpacity>
  );
};

const RecommendationsPage = () => {
  const theme = useTheme();
  const utils = api.useUtils();

  const { data: recommendations } =
    api.contacts.getRecommendationProfilesSelf.useQuery();

  const followUserMutation = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      await utils.contacts.getRecommendationProfilesSelf.cancel();
      const prevData = utils.contacts.getRecommendationProfilesSelf.getData();
      if (!prevData) return { prevData: undefined };

      utils.contacts.getRecommendationProfilesSelf.setData(
        undefined,
        prevData.map((item) =>
          item.userId === newData.userId
            ? {
                ...item,
                relationshipStatus:
                  item.privacy === "private" ? "requested" : "following",
              }
            : item,
        ),
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx?.prevData === undefined) return;
      utils.contacts.getRecommendationProfilesSelf.setData(
        undefined,
        ctx.prevData,
      );
    },
  });

  const handleUserSelected = async (userId: string, added: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (added) {
      await followUserMutation.mutateAsync({ userId });
    }
  };

  const handleBack = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <BaseScreenView
      flex={1}
      backgroundColor={theme.background.val}
      padding={0}
      safeAreaEdges={["top", "bottom"]}
    >
      <XStack
        paddingHorizontal="$4"
        paddingTop="$2"
        paddingBottom="$4"
        marginTop="$4"
        alignItems="center"
        space="$3"
      >
        <TouchableOpacity onPress={handleBack}>
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text
          flex={1}
          fontSize="$6"
          color="white"
          fontWeight="bold"
          textAlign="center"
          marginRight={24}
        >
          Recommendations
        </Text>
      </XStack>
      <FlashList
        data={recommendations}
        estimatedItemSize={itemWidth}
        renderItem={({ item, index }) => (
          <AnimatedUserProfile
            user={item}
            index={index}
            onUserSelected={handleUserSelected}
            isAdded={
              item.relationshipStatus === "following" ||
              item.relationshipStatus === "requested"
            }
          />
        )}
        numColumns={3}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        contentContainerStyle={{
          paddingHorizontal: 12,
        }}
      />
    </BaseScreenView>
  );
};

export default RecommendationsPage;
