import React from "react";
import { useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { getToken, YStack } from "tamagui";
import type { SpaceTokens, Token } from "tamagui";

import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import { Spacer } from "./ui";
import { HeaderTitle } from "./ui/Headings";
import { UserCard } from "./ui/UserCard";

type Friend = RouterOutputs["friend"]["paginateFriendsSelf"]["items"][number];

interface FriendCarouselProps {
  paddingHorizontal?: SpaceTokens;
  paddingVertical?: SpaceTokens;
  onUserPress: (params: { userId: string; username: string }) => void;
}

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
  onUserPress,
}: FriendCarouselProps) => {
  const { width: windowWidth } = useWindowDimensions();
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

  if (!isLoading && !friends.length) {
    return null;
  }

  return (
    <YStack paddingVertical={paddingVertical} gap="$2">
      <HeaderTitle icon="people" paddingHorizontal={paddingHorizontal}>
        Friends
      </HeaderTitle>

      <FlashList<Friend | null>
        data={isLoading ? Array(4).fill(null) : [...friends, null]}
        horizontal
        showsHorizontalScrollIndicator={false}
        estimatedItemSize={CARD_WIDTH}
        ItemSeparatorComponent={() => <Spacer width={CARD_GAP} />}
        contentContainerStyle={{
          paddingHorizontal: getToken(
            paddingHorizontal as Token,
            "space",
          ) as number,
        }}
        renderItem={({ item, index }) => {
          if (isLoading) {
            return <LoadingCard width={CARD_WIDTH} />;
          }

          if (!item) {
            return (
              <UserCard.SeeAll
                width={CARD_WIDTH}
                onPress={() => router.push("/self-connections/friends")}
                index={index}
              />
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
                onUserPress({ userId: item.userId, username: item.username })
              }
            />
          );
        }}
      />
    </YStack>
  );
};

export default FriendCarousel;
