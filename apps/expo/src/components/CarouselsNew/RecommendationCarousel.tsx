import React, { useMemo } from "react";
import { TouchableOpacity, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { ChevronRight, Sparkles } from "@tamagui/lucide-icons";
import { getToken, Spinner, Text, View, XStack, YStack } from "tamagui";

import useRouteProfile from "~/hooks/useRouteProfile";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import { UserCard } from "../ui/UserCard";

type Recommendation =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"][number];
type SeeAllItem = { type: "see-all" };
type ListItem = Recommendation | SeeAllItem;

const isRecommendation = (item: ListItem): item is Recommendation => {
  return !("type" in item);
};

const SeeAllCard = ({ width }: { width: number }) => (
  <YStack
    width={width}
    height={width * 1.2}
    borderRadius="$6"
    backgroundColor="$gray3"
    alignItems="center"
    justifyContent="center"
    gap="$2"
    opacity={0.8}
  >
    <ChevronRight size={24} opacity={0.6} />
    <Text fontSize="$2" fontWeight="500" opacity={0.6}>
      See All
    </Text>
  </YStack>
);

const RecommendationCarousel = () => {
  const { width: windowWidth } = useWindowDimensions();
  const { routeProfile } = useRouteProfile();
  const router = useRouter();
  const utils = api.useUtils();

  const { data: recommendationsData, isLoading } =
    api.contacts.getRecommendationProfilesSelf.useQuery(undefined, {
      staleTime: 60 * 1000, // 1 minute
    });

  const recommendations = useMemo(
    () => recommendationsData ?? [],
    [recommendationsData],
  );

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

  if (isLoading) {
    return (
      <YStack padding="$4" alignItems="center">
        <Spinner size="small" />
      </YStack>
    );
  }

  if (!recommendations?.length) {
    return null;
  }

  const CARD_WIDTH = windowWidth * 0.25;
  const CARD_GAP = getToken("$3", "space") as number;

  const items: ListItem[] = [...recommendations, { type: "see-all" }];

  return (
    <YStack gap="$2">
      <XStack alignItems="center" gap="$2" opacity={0.7}>
        <Sparkles size={14} />
        <Text fontSize="$3" fontWeight="500">
          Suggested for You
        </Text>
      </XStack>

      <FlashList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        estimatedItemSize={CARD_WIDTH}
        ItemSeparatorComponent={() => <View width={CARD_GAP} />}
        renderItem={({ item, index }) => {
          if (!isRecommendation(item)) {
            return (
              <TouchableOpacity
                onPress={() => router.push("/(app)/(recommended)")}
              >
                <SeeAllCard width={CARD_WIDTH} />
              </TouchableOpacity>
            );
          }

          return (
            <UserCard
              userId={item.userId}
              username={item.username}
              profilePictureUrl={item.profilePictureUrl}
              size="small"
              width={CARD_WIDTH}
              index={index}
              onPress={() =>
                routeProfile({ userId: item.userId, username: item.username })
              }
              actionButton={{
                label: "Follow",
                onPress: () =>
                  followMutation.mutateAsync({ userId: item.userId }),
                variant: "primary",
                icon: "follow",
              }}
            />
          );
        }}
      />
    </YStack>
  );
};

export default RecommendationCarousel;
