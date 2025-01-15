import React from "react";
import { TouchableOpacity, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { ChevronRight, Users } from "@tamagui/lucide-icons";
import { getToken, Text, View, XStack, YStack } from "tamagui";
import type { SpaceTokens, Token } from "tamagui";

import useRouteProfile from "~/hooks/useRouteProfile";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import { H5, Spacer } from "./ui";
import { HeaderTitle } from "./ui/Headings";
import { UserCard } from "./ui/UserCard";

type Friend = RouterOutputs["friend"]["paginateFriendsSelf"]["items"][number];

interface FriendCarouselProps {
  paddingHorizontal?: SpaceTokens;
  paddingVertical?: SpaceTokens;
}

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

const LoadingCard = ({ width }: { width: number }) => (
  <YStack
    width={width}
    height={width * 1.2}
    borderRadius="$6"
    backgroundColor="$gray3"
    opacity={0.5}
  />
);

const FriendCarousel = ({
  paddingHorizontal,
  paddingVertical,
}: FriendCarouselProps = {}) => {
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

  const friends = friendsData?.pages.flatMap((page) => page.items) ?? [];

  const CARD_WIDTH = windowWidth * 0.25;
  const CARD_GAP = getToken("$2.5", "space") as number;

  if (!isLoading && !friends?.length) {
    return null;
  }

  return (
    <YStack paddingVertical={paddingVertical} gap="$2">
      <HeaderTitle icon={<Users />} paddingHorizontal={paddingHorizontal}>
        Friends
      </HeaderTitle>

      <FlashList
        data={isLoading ? Array(4).fill(null) : [...friends, null]}
        horizontal
        showsHorizontalScrollIndicator={false}
        estimatedItemSize={CARD_WIDTH}
        ItemSeparatorComponent={() => <Spacer width={CARD_GAP} />}
        contentContainerStyle={{
          paddingHorizontal: getToken(paddingHorizontal as Token, "space"),
        }}
        renderItem={({ item, index }) => {
          if (isLoading) {
            return <LoadingCard width={CARD_WIDTH} />;
          }

          if (!item) {
            return (
              <TouchableOpacity
                onPress={() => router.push("/self-connections/friends")}
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
