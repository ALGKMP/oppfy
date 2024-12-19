import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { getToken, H5, Spacer, Text, View, XStack, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { Skeleton } from "~/components/Skeletons";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";
import UserItem from "./UserItem";

/*
 * TODO: Can make this a compound component later if we want to add more styles
 * or if we want to add more functionality to the carousel.
 * For example
 * - Turning the show more on and off
 * - Big cards and small cards
 */

interface FriendCarouselProps {
  userId?: string;
}

function FriendCarousel(props: FriendCarouselProps) {
  const { userId } = props;
  const {
    data: friendsData,
    isLoading: isLoadingFriendsData,
    refetch: refetchFriendsData, // TODO: Some Context on the page that triggers refetching
  } = useGetFriends({ userId });
  const friendsItems = friendsData?.pages.flatMap((page) => page.items) ?? [];

  const onShowMore = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!userId) {
      router.push({
        pathname: "/self-profile/connections/friends",
        params: { userId: props.userId },
      });
    } else {
      router.push({
        pathname: "/profile/connections/friends",
        params: { userId: props.userId },
      });
    }
  };

  if (isLoadingFriendsData) {
    return (
      <CardContainer paddingLeft={0} paddingRight={0}>
        <FlashList
          data={PLACEHOLDER_DATA}
          horizontal
          ListEmptyComponent={null}
          estimatedItemSize={70}
          showsHorizontalScrollIndicator={false}
          renderItem={() => <Skeleton circular size={70} />}
          ItemSeparatorComponent={() => <Spacer size="$2.5" />}
          contentContainerStyle={{
            paddingHorizontal: getToken("$2", "space") as number,
          }}
        />
      </CardContainer>
    );
  }

  return (
    <CardContainer paddingHorizontal={0}>
      <YStack gap="$3">
        <XStack
          justifyContent="space-between"
          alignItems="center"
          paddingHorizontal="$3"
        >
          <H5>Friends</H5>
          <TouchableOpacity onPress={onShowMore}>
            <Text theme="alt1" fontSize="$3" fontWeight="600">
              See all
            </Text>
          </TouchableOpacity>
        </XStack>

        <FlashList
          data={friendsItems}
          horizontal
          estimatedItemSize={70}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <UserItem item={item} />}
          ItemSeparatorComponent={() => <Spacer size="$2.5" />}
          contentContainerStyle={{
            paddingHorizontal: getToken("$2.5", "space") as number,
          }}
        />
      </YStack>
    </CardContainer>
  );
}

/*
 * ==========================================
 * ============== Hooks =====================
 * ==========================================
 */

/**
 * A hook that gets the friends of a user
 *
 * @param {string} userId - The userId of the user
 * @returns {actions: {follow: {handler: () => void, loading: boolean}, unfollow: {handler: () => void, loading: boolean}, cancelFollowRequest: {handler: () => void, loading: boolean}, cancelFriendRequest: {handler: () => void, loading: boolean}, removeFriend: {handler: () => void, loading: boolean}}}
 */

interface UseGetFriendsProps {
  userId?: string;
}

const useGetFriends = (props: UseGetFriendsProps) => {
  const { userId } = props;

  const selfQuery = api.friend.paginateFriendsSelf.useInfiniteQuery(
    { pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !userId,
      refetchOnMount: true,
    },
  );

  const othersQuery = api.friend.paginateFriendsOthers.useInfiniteQuery(
    { userId: userId ?? "", pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!userId,
      refetchOnMount: true,
    },
  );

  return userId ? othersQuery : selfQuery;
};

export default FriendCarousel;
