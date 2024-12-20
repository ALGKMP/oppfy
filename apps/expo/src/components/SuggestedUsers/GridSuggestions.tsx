import React, { useMemo } from "react";
import { FlatList } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
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
import useRouteProfile from "~/hooks/useRouteProfile";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

type RecommendationItem =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"][0];

const AnimatedYStack = Animated.createAnimatedComponent(YStack);

const SkeletonItem = ({ index }: { index: number }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ),
      -1,
      true,
    ),
  }));

  return (
    <Animated.View
      key={index}
      entering={FadeInDown.delay(index * 100)}
      style={[
        {
          flex: 1,
          aspectRatio: 1,
          backgroundColor: "#eee",
          borderRadius: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 5,
        },
        animatedStyle,
      ]}
    />
  );
};

interface SuggestionItemProps {
  item: RecommendationItem;
  index: number;
  onPressProfile: (userId: string, username: string) => void;
  onFollow: (userId: string) => void;
}

const SuggestionItem = ({
  item,
  index,
  onPressProfile,
  onFollow,
}: SuggestionItemProps) => (
  <AnimatedYStack
    entering={FadeInDown.delay(index * 100).springify()}
    flex={1}
    aspectRatio={1}
  >
    <YStack
      flex={1}
      overflow="hidden"
      borderRadius="$6"
      backgroundColor="$background"
      elevation={5}
      shadowColor="#000"
      shadowOffset={{ width: 0, height: 10 }}
      shadowOpacity={0.2}
      shadowRadius={20}
      onPress={() => onPressProfile(item.userId, item.username)}
      pressStyle={{ opacity: 0.8 }}
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

      <YStack position="absolute" bottom={0} left={0} right={0} p="$3" gap="$2">
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
            onPress={() => onFollow(item.userId)}
          >
            Follow
          </Button>
        </Animated.View>
      </YStack>
    </YStack>
  </AnimatedYStack>
);

const GridSuggestions = () => {
  const utils = api.useUtils();
  const { routeProfile } = useRouteProfile();

  const { data, isLoading } =
    api.contacts.getRecommendationProfilesSelf.useQuery(undefined, {
      staleTime: 10000,
    });

  const followMutation = api.follow.followUser.useMutation({
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
      if (ctx?.prevData) {
        void utils.contacts.getRecommendationProfilesSelf.invalidate();
      }
    },
  });

  const handleFollow = (userId: string) => {
    followMutation.mutateAsync({ userId }).catch(() => {
      /* Handle error if needed */
    });
  };

  const handleProfilePress = (userId: string, username: string) => {
    routeProfile({ userId, username });
  };

  const renderSkeletons = useMemo(
    () => (
      <YStack px="$4" gap="$4">
        <H5 theme="alt1">Suggested for You</H5>
        <YStack flexDirection="row" flexWrap="wrap" gap="$3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonItem key={i} index={i} />
          ))}
        </YStack>
      </YStack>
    ),
    [],
  );

  if (isLoading) return renderSkeletons;

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

  return (
    <YStack>
      <FlatList
        data={data}
        renderItem={({ item, index }) => (
          <SuggestionItem
            item={item}
            index={index}
            onPressProfile={handleProfilePress}
            onFollow={handleFollow}
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
