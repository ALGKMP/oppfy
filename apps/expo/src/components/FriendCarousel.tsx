import React from "react";
import { useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { getToken, YStack } from "tamagui";
import type { SpaceTokens, Token } from "tamagui";

import useRouteProfile from "~/hooks/useRouteProfile";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { Spacer } from "./ui";
import { HeaderTitle } from "./ui/Headings";
import { UserCard } from "./ui/UserCard";

interface FriendCarouselProps {
  userId?: string;
  paddingVertical?: SpaceTokens;
  paddingHorizontal?: SpaceTokens;
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
  userId,
  paddingVertical,
  paddingHorizontal,
}: FriendCarouselProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const router = useRouter();
  const { routeProfile } = useRouteProfile();

  const { friends, isLoading } = useFriends({ userId });

  const CARD_WIDTH = windowWidth * 0.25;
  const CARD_GAP = getToken("$2.5", "space") as number;

  if (!isLoading && !friends?.length) {
    return null;
  }

  return (
    <YStack paddingVertical={paddingVertical} gap="$2">
      <HeaderTitle icon="people" paddingHorizontal={paddingHorizontal}>
        Friends
      </HeaderTitle>

      <FlashList<Friend | null>
        // data={isLoading ? Array(4).fill(null) : [...(friends ?? []), null]}
        data={friends}
        ListEmptyComponent={
          <YStack flexDirection="row" gap={CARD_GAP}>
            {Array(4).fill(null).map((_, i) => (
              <LoadingCard key={i} width={CARD_WIDTH} />
            ))}
          </YStack>
        }
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
          // if (isLoading) {
          //   return <LoadingCard width={CARD_WIDTH} />;
          // }

          if (!item) {
            return (
              <UserCard.SeeAll
                width={CARD_WIDTH}
                onPress={() =>
                  router.push(
                    userId
                      ? `/connections/${userId}/friends`
                      : "/self-connections/friends",
                  )
                }
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
                routeProfile(item.userId, {
                  name: item.name,
                  username: item.username,
                  profilePictureUrl: item.profilePictureUrl,
                })
              }
            />
          );
        }}
      />
    </YStack>
  );
};

type Friend = RouterOutputs["friend"]["paginateFriendsSelf"]["items"][number];

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

interface UseFriendsProps {
  userId?: string;
  pageSize?: number;
}

const useFriends = ({ userId, pageSize = 10 }: UseFriendsProps = {}) => {
  const query = api.friend.paginateFriendsOthers.useInfiniteQuery(
    { userId: userId!, pageSize },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: STALE_TIME,
      enabled: !!userId,
    },
  );

  const selfQuery = api.friend.paginateFriendsSelf.useInfiniteQuery(
    { pageSize },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: STALE_TIME,
      enabled: !userId,
    },
  );

  const activeQuery = userId ? query : selfQuery;

  return {
    isLoading: activeQuery.isLoading,
    friends: activeQuery.data?.pages.flatMap((page) => page.items),
  };
};

export default FriendCarousel;
