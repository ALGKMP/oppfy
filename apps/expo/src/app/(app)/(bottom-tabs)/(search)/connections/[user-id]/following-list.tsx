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

const Following = () => {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const router = useRouter();
  const headerHeight = useHeaderHeight();

  const unfollow = api.follow.unfollowUser.useMutation({
    onSuccess: (_data, variables) => {
      setUnfollowed((prev) => ({
        ...prev,
        [variables.userId]: true,
      }));
    },
  });

  const follow = api.follow.followUser.useMutation({
    onSuccess: (_data, variables) => {
      setUnfollowed((prev) => ({
        ...prev,
        [variables.userId]: false,
      }));
    },
  });


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

  useEffect(() => {
    // log the follow data
    console.log(followingData?.pages.flatMap((page) => page.items));
  }
  , [followingData]);

  const placeholderData = useMemo(() => {
    return Array.from({ length: 20 }, () => null);
  }, []);

  const friendsItems = useMemo(() => {
    return followingData?.pages.flatMap((page) => page.items);
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

  const [unfollowed, setUnfollowed] = useState<Record<string, boolean>>({});

  const toggleFollowStatus = (recipientId: string) => {
    const isFollowing = !unfollowed[recipientId];
    isFollowing
      ? unfollow.mutate({ userId })
      : follow.mutate({ userId: recipientId });
  };

  return (
    <BaseScreenView paddingBottom={0}>
      {isLoading || itemCount ? (
        <FlashList
          onRefresh={refetch}
          refreshing={isLoading}
          extraData={unfollowed}
          data={isLoading ? placeholderData : friendsItems}
          ItemSeparatorComponent={Separator}
          estimatedItemSize={75}
          onEndReached={handleOnEndReached}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <SizableText size="$2" theme="alt1" marginBottom="$2">
              FOLLOWERS
            </SizableText>
          }
          renderItem={({ item }) => {
            return (
              <View>
                {item === null ? (
                  <VirtualizedListItem
                    loading
                    showSkeletons={{
                      imageUrl: true,
                      title: true,
                      subtitle: true,
                      button: true,
                    }}
                  />
                ) : (
                  <VirtualizedListItem
                    loading={false}
                    title={item.username}
                    subtitle={item.name}
                    imageUrl={item.profilePictureUrl}
                    button={{
                      onPress: () => toggleFollowStatus(item.userId),
                      ...(unfollowed[item.userId]
                        ? { text: "Follow", icon: UserRoundPlus }
                        : { text: "Unfollow", icon: UserRoundMinus }),
                    }}
                    onPress={() =>
                      // @ts-ignore
                      router.push({
                        pathname: "/profile/[profile-id]",
                        params: { profileId: String(3401) },
                      })
                    }
                  />
                )}
              </View>
            );
          }}
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
