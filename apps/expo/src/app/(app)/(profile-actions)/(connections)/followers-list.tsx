import React, { useMemo, useState } from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { UserRoundX } from "@tamagui/lucide-icons";
import { Separator, SizableText, View } from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const Followers = () => {
  const headerHeight = useHeaderHeight();

  const {
    data: followersData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = api.user.getCurrentUserFollowers.useInfiniteQuery(
    {
      pageSize: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const placeholderData = useMemo(() => {
    return Array.from({ length: 20 }, () => null);
  }, []);

  const friendsItems = useMemo(() => {
    return followersData?.pages.flatMap((page) => page.items);
  }, [followersData]);

  const itemCount = useMemo(() => {
    if (followersData === undefined) return 0;

    return followersData.pages.reduce(
      (total, page) => total + page.items.length,
      0,
    );
  }, [followersData]);

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const [unfollowed, setUnfollowed] = useState<Record<string, boolean>>({});

  const toggleUnfollow = (id: string) => {
    setUnfollowed((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <BaseScreenView paddingBottom={0}>
      {isLoading || itemCount ? (
        <FlashList
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
          renderItem={({ item, index }) => {
            return (
              <View>
                {item === null ? (
                  <VirtualizedListItem
                    key={index}
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
                    key={index}
                    loading={false}
                    title={item.username}
                    subtitle={item.name}
                    imageUrl={item.profilePictureUrl}
                    button={{
                      title: unfollowed[item.userId] ? "Follow" : "Unfollow",
                      onPress: () => toggleUnfollow(item.userId),
                    }}
                  />
                )}
              </View>
            );
          }}
        />
      ) : (
        <View flex={1} justifyContent="center" bottom={headerHeight}>
          <EmptyPlaceholder
            title="Followers"
            subtitle="You'll see all the people who follow you here."
            icon={<UserRoundX />}
          />
        </View>
      )}
    </BaseScreenView>
  );
};

export default Followers;
