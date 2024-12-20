import React from "react";
import { FlatList } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { UserRoundPlus } from "@tamagui/lucide-icons";
import { getToken } from "tamagui";

import { Button, H5, H6, Text, YStack } from "~/components/ui";
import { api } from "~/utils/api";
import useRouteProfile from "~/hooks/useRouteProfile";
import type { RouterOutputs } from "~/utils/api";

type RecommendationItem =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"][0];

const AnimatedYStack = Animated.createAnimatedComponent(YStack);

const GridSuggestions: React.FC = () => {
  const utils = api.useUtils();
  const { routeProfile } = useRouteProfile();

  const { data, isLoading } = api.contacts.getRecommendationProfilesSelf.useQuery();

  const followMutation = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      await utils.contacts.getRecommendationProfilesSelf.cancel();

      const prevData = utils.contacts.getRecommendationProfilesSelf.getData();
      if (!prevData) return;

      utils.contacts.getRecommendationProfilesSelf.setData(
        undefined,
        prevData.map((item) =>
          item.userId === newData.userId
            ? {
                ...item,
                relationshipState:
                  item.privacy === "private"
                    ? "followRequestSent"
                    : "following",
              }
            : item,
        ),
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      void utils.contacts.getRecommendationProfilesSelf.invalidate();
    },
  });

  const handleFollow = async (userId: string) => {
    await followMutation.mutateAsync({ userId });
  };

  const handleProfilePress = (userId: string, username: string) => {
    routeProfile({ userId, username });
  };

  if (isLoading) {
    return (
      <YStack px="$4" gap="$4">
        <H5 theme="alt1">Suggested for You</H5>
        <YStack flexDirection="row" flexWrap="wrap" gap="$3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(i * 100)}
              style={[
                {
                  flex: 1,
                  aspectRatio: 1,
                  backgroundColor: "$gray5",
                  borderRadius: "$5",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.1,
                  shadowRadius: 20,
                  elevation: 5,
                },
                useAnimatedStyle(() => ({
                  opacity: withRepeat(
                    withSequence(
                      withTiming(0.5, { duration: 1000 }),
                      withTiming(1, { duration: 1000 }),
                    ),
                    -1,
                    true,
                  ),
                })),
              ]}
            />
          ))}
        </YStack>
      </YStack>
    );
  }

  if (!data?.length) {
    return (
      <YStack px="$4">
        <H5 mb="$4" theme="alt1">
          Suggested for You
        </H5>
        <H6 theme="alt2">No suggestions available</H6>
      </YStack>
    );
  }

  const renderItem = ({
    item,
    index,
  }: {
    item: RecommendationItem;
    index: number;
  }) => (
    <AnimatedYStack
      entering={FadeInDown.delay(index * 100).springify()}
      flex={1}
      aspectRatio={1}
    >
      <YStack
        borderRadius="$6"
        overflow="hidden"
        backgroundColor="$background"
        elevation={5}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 10 }}
        shadowOpacity={0.2}
        shadowRadius={20}
        flex={1}
        pressStyle={{
          scale: 0.96,
          transform: [{ translateY: 5 }],
        }}
        onPress={() => handleProfilePress(item.userId, item.username)}
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

          <Animated.View entering={FadeIn.delay(index * 100 + 200)}>
            <Button
              size="$3"
              variant="primary"
              icon={UserRoundPlus}
              pressStyle={{ scale: 0.95 }}
              opacity={0.85}
              onPress={() => handleFollow(item.userId)}
            >
              Follow
            </Button>
          </Animated.View>
        </YStack>
      </YStack>
    </AnimatedYStack>
  );

  return (
    <YStack>
      <FlatList
        data={data}
        renderItem={renderItem}
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
