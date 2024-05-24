import React, { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { UserRoundMinus, UserRoundPlus } from "@tamagui/lucide-icons";
import { Separator, SizableText, View } from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const Following = () => {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const router = useRouter();
  const headerHeight = useHeaderHeight();

  const follow = api.follow.followUser.useMutation();
  const unfollow = api.follow.unfollowUser.useMutation();

  const {
    data: followingData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.follow.paginateFollowingOthers.useInfiniteQuery(
    {
      userId,
      pageSize: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const followingItems = useMemo(() => {
    return followingData?.pages.flatMap((page) => page.items) ?? [];
  }, [followingData]);

  const itemCount = useMemo(() => {
    if (followingData === undefined) return 0;
    return followingData.pages.reduce(
      (total, page) => total + page.items.length,
      0,
    );
  }, [followingData]);

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const toggleFollowStatus = (userId: string, isFollowing: boolean) => {
    isFollowing ? unfollow.mutate({ userId }) : follow.mutate({ userId });
  };

  if (isLoading && itemCount === 0) {
    return (
      <BaseScreenView paddingBottom={0}>
        <FlashList
          data={PLACEHOLDER_DATA}
          ItemSeparatorComponent={Separator}
          estimatedItemSize={75}
          renderItem={() => (
            <VirtualizedListItem
              loading
              showSkeletons={{
                imageUrl: true,
                title: true,
                subtitle: true,
                button: true,
              }}
            />
          )}
        />
      </BaseScreenView>
    );
  }

  return (
    <BaseScreenView paddingBottom={0}>
      {itemCount > 0 ? (
        <FlashList
          onRefresh={refetch}
          refreshing={isLoading}
          data={followingItems}
          ItemSeparatorComponent={Separator}
          estimatedItemSize={75}
          onEndReached={handleOnEndReached}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <SizableText size="$2" theme="alt1" marginBottom="$2">
              FOLLOWERS
            </SizableText>
          }
          renderItem={({ item }) => (
            <View>
              <VirtualizedListItem
                loading={false}
                title={item.username}
                subtitle={item.name}
                imageUrl={item.profilePictureUrl}
                button={{
                  onPress: () =>
                    toggleFollowStatus(item.userId, item.isFollowing),
                  ...(item.isFollowing
                    ? { text: "Unfollow", icon: UserRoundMinus }
                    : { text: "Follow", icon: UserRoundPlus }),
                }}
                onPress={() =>
                  // @ts-expect-error: Experimental typed routes dont support layouts yet
                  router.push({
                    pathname: "/profile/[profile-id]",
                    params: { profileId: String(item.userId) },
                  })
                }
              />
            </View>
          )}
        />
      ) : (
        <View flex={1} justifyContent="center" bottom={headerHeight}>
          <EmptyPlaceholder
            title="Following"
            subtitle="Once you follow someone, you'll see them here."
            icon={<UserRoundPlus />}
          />
        </View>
      )}
    </BaseScreenView>
  );
};

export default Following;
