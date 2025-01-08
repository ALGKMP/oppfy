import React, { useMemo } from "react";
import { TouchableOpacity, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { ChevronRight, Users } from "@tamagui/lucide-icons";
import { getToken, Spinner, Text, View, XStack, YStack } from "tamagui";

import useRouteProfile from "~/hooks/useRouteProfile";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import { UserCard } from "../ui/UserCard";

type Friend = RouterOutputs["friend"]["paginateFriendsSelf"]["items"][number];
type SeeAllItem = { type: "see-all" };
type ListItem = Friend | SeeAllItem;

const isFriend = (item: ListItem): item is Friend => {
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

const FriendCarousel = () => {
  const { width: windowWidth } = useWindowDimensions();
  const { routeProfile } = useRouteProfile();
  const router = useRouter();

  const { data: friendsData, isLoading } =
    api.friend.paginateFriendsSelf.useInfiniteQuery(
      { pageSize: 10 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 60 * 1000, // 1 minute
      },
    );

  const friends = useMemo(
    () => friendsData?.pages.flatMap((page) => page.items) ?? [],
    [friendsData],
  );

  if (isLoading) {
    return (
      <YStack padding="$4" alignItems="center">
        <Spinner size="small" />
      </YStack>
    );
  }

  if (!friends?.length) {
    return null;
  }

  const CARD_WIDTH = windowWidth * 0.25;
  const CARD_GAP = getToken("$3", "space") as number;

  const items: ListItem[] = [...friends, { type: "see-all" }];

  return (
    <YStack gap="$2">
      <XStack alignItems="center" gap="$2" opacity={0.7}>
        <Users size={14} />
        <Text fontSize="$3" fontWeight="500">
          Your Circle
        </Text>
      </XStack>

      <FlashList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        estimatedItemSize={CARD_WIDTH}
        ItemSeparatorComponent={() => <View width={CARD_GAP} />}
        renderItem={({ item, index }) => {
          if (!isFriend(item)) {
            return (
              <TouchableOpacity
                onPress={() => router.push("/self-profile/connections/friends")}
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
            />
          );
        }}
      />
    </YStack>
  );
};

export default FriendCarousel;
