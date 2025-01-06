import React, { useMemo } from "react";
import { Dimensions, FlatList } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { getToken } from "tamagui";

import { Button, H5, Text, YStack } from "~/components/ui";
import useRouteProfile from "~/hooks/useRouteProfile";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

const STALE_TIME = 60 * 1000;

type RecommendationItem =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"][0];

const AnimatedYStack = Animated.createAnimatedComponent(YStack);

interface SuggestionItemProps {
  item: RecommendationItem;
  index: number;
  onPressProfile: (userId: string, username: string) => void;
  onFollow: (userId: string) => void;
}

const { width: screenWidth } = Dimensions.get("window");
const TILE_WIDTH = screenWidth / 2 - getToken("$3", "space") * 2; // Two tiles with gap in between

const SuggestionItem = ({
  item,
  index,
  onPressProfile,
  onFollow,
}: SuggestionItemProps) => {
  // Animation for the card press
  const cardScale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const handlePressIn = () => {
    cardScale.value = withSpring(0.95, { damping: 10, stiffness: 200 });
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  // Animation for the follow button press
  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleFollowPress = async () => {
    // Animate button press
    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 8, stiffness: 200 }),
    );
    await onFollow(item.userId);
  };

  return (
    <AnimatedYStack
      entering={FadeInDown.delay(index * 100).springify()}
      width={TILE_WIDTH}
      aspectRatio={1}
    >
      <AnimatedYStack
        flex={1}
        overflow="hidden"
        borderRadius="$6"
        backgroundColor="$background"
        elevation={5}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 10 }}
        shadowOpacity={0.2}
        shadowRadius={20}
        style={cardStyle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPressProfile(item.userId, item.username)}
      >
        <Image
          recyclingKey={item.userId}
          source={item.profilePictureUrl ?? DefaultProfilePicture}
          style={{ width: "100%", aspectRatio: 1 }}
          contentFit="cover"
          transition={200}
        />

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "50%",
          }}
        />

        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          p="$3"
          gap="$2"
        >
          <Text
            numberOfLines={1}
            fontWeight="600"
            fontSize={16}
            color="white"
            opacity={0.85}
            textShadowColor="rgba(0, 0, 0, 0.3)"
            textShadowOffset={{ width: 0, height: 1 }}
            textShadowRadius={2}
          >
            {item.username}
          </Text>

          <Animated.View
            entering={FadeIn.delay(index * 100 + 200)}
            style={buttonStyle}
          >
            <Button
              size="$3"
              variant="primary"
              onPress={handleFollowPress}
              // Using the built-in pressStyle for a slight visual feedback in addition to our custom animation
              pressStyle={{ opacity: 0.8 }}
            >
              Follow
            </Button>
          </Animated.View>
        </YStack>
      </AnimatedYStack>
    </AnimatedYStack>
  );
};

const GridSuggestions = () => {
  const utils = api.useUtils();
  const { routeProfile } = useRouteProfile();

  const { data: rawData, isLoading } =
    api.contacts.getRecommendationProfilesSelf.useQuery(undefined, {
      staleTime: STALE_TIME,
    });

  const data = useMemo(() => {
    if (!rawData) return [];
    return rawData;
  }, [rawData]);

  const followMutation = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      await utils.contacts.getRecommendationProfilesSelf.cancel();
      const prevData = utils.contacts.getRecommendationProfilesSelf.getData();
      if (!prevData) return { prevData: undefined };

      utils.contacts.getRecommendationProfilesSelf.setData(
        undefined,
        prevData.filter((item) => item.userId !== newData.userId),
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx?.prevData === undefined) return;
      void utils.contacts.getRecommendationProfilesSelf.invalidate();
    },
  });

  const handleProfilePress = (userId: string, username: string) => {
    routeProfile({ userId, username });
  };

  if (!data?.length || isLoading) {
    return null;
  }

  return (
    <YStack>
      <FlatList
        data={data}
        renderItem={({ item, index }) => (
          <SuggestionItem
            item={item}
            index={index}
            onPressProfile={handleProfilePress}
            onFollow={(userId) => followMutation.mutateAsync({ userId })}
          />
        )}
        numColumns={2}
        ListHeaderComponent={<H5 theme="alt1">Suggested for You</H5>}
        columnWrapperStyle={{ gap: getToken("$3", "space") }}
        contentContainerStyle={{ gap: getToken("$3", "space") }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </YStack>
  );
};

export default GridSuggestions;
