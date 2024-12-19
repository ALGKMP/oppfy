import React, { useCallback, useEffect, useRef } from "react";
import { TouchableOpacity } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { throttle } from "lodash";
import { getToken, H5, Spacer, Text, View, XStack, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { Skeleton } from "~/components/Skeletons";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";
import UserItem from "./UserItem";

/*
 * TODO: Can make this a compound component later if we want to add more styles
 * or if we want to add more functionality to the carousel.
 * For example, the Instagram carousel, and how some have big cards and some have small cards.
 */

interface PersonItem {
  userId: string;
  username: string;
  profilePictureUrl: string | null;
}

interface LoadedProps<T extends PersonItem> {
  userId: string;
  // data: T[];
  // title?: string;
  // emoji?: string;
}

type FriendCarouselProps = LoadedProps<PersonItem>;

function FriendCarousel(props: FriendCarouselProps) {
  const {
    data: friendsData,
    isLoading: isLoadingFriendsData,
    refetch: refetchFriendsData, // TODO: Some Context on the page that triggers refetching
  } = api.friend.paginateFriendsOthers.useInfiniteQuery(
    { userId: props.userId, pageSize: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!props.userId,
      refetchOnMount: true,
    },
  );

  const friendsItems = friendsData?.pages.flatMap((page) => page.items) ?? [];

  const onShowMore = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/profile/connections/friends",
      params: { userId: props.userId },
    });
  };

  const throttledHandleShowMore = useRef(
    throttle(onShowMore, 300, { leading: true, trailing: false }),
  ).current;

  useEffect(() => {
    return () => {
      throttledHandleShowMore.cancel();
    };
  }, [throttledHandleShowMore]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isLoadingFriendsData) return;

      const { contentSize, contentOffset, layoutMeasurement } =
        event.nativeEvent;
      const contentWidth = contentSize.width;
      const offsetX = contentOffset.x;
      const layoutWidth = layoutMeasurement.width;

      if (offsetX + layoutWidth >= contentWidth + 80) {
        throttledHandleShowMore();
      }
    },
    [isLoadingFriendsData, throttledHandleShowMore],
  );

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
        <XStack justifyContent="space-between" alignItems="center" paddingHorizontal="$3">
          <H5>Friends</H5>
          <TouchableOpacity onPress={throttledHandleShowMore}>
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
          onScroll={handleScroll}
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

export default FriendCarousel;
