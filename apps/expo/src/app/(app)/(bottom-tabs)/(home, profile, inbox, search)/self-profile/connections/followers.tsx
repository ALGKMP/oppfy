import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { UserRoundMinus, UserRoundPlus } from "@tamagui/lucide-icons";
import { getToken, H6, YStack } from "tamagui";

import { SearchInput } from "~/components/Inputs";
import {
  MediaListItem,
  MediaListItemSkeleton,
  useActionSheetController,
} from "~/components/ui";
import { Spacer } from "~/components/ui/Spacer";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import useSearch from "~/hooks/useSearch";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type FollowerItem =
  RouterOutputs["follow"]["paginateFollowersSelf"]["items"][0];

const PAGE_SIZE = 20;

const Followers = () => {
  const utils = api.useUtils();
  const actionSheet = useActionSheetController();

  const [refreshing, setRefreshing] = useState(false);

  const removeFollower = api.follow.removeFollower.useMutation({
    onMutate: async (newData) => {
      await utils.follow.paginateFollowersSelf.cancel({ pageSize: PAGE_SIZE });
      const prevData = utils.follow.paginateFollowersSelf.getInfiniteData({
        pageSize: PAGE_SIZE,
      });
      if (prevData === undefined) return;

      utils.follow.paginateFollowersSelf.setInfiniteData(
        { pageSize: PAGE_SIZE },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.userId !== newData.userId),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      utils.follow.paginateFollowersSelf.setInfiniteData(
        { pageSize: PAGE_SIZE },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      await utils.follow.paginateFollowersSelf.invalidate({
        pageSize: PAGE_SIZE,
      });
    },
  });

  const {
    data: followersData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.follow.paginateFollowersSelf.useInfiniteQuery(
    { pageSize: PAGE_SIZE },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const followerItems = useMemo(() => {
    return followersData?.pages.flatMap((page) => page.items) ?? [];
  }, [followersData]);

  const { searchQuery, setSearchQuery, filteredItems } = useSearch({
    data: followerItems,
    keys: ["name", "username"],
  });

  const handleOnEndReached = useCallback(async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const handleRemoveFollower = useCallback(
    async (userId: string) => {
      await removeFollower.mutateAsync({ userId });
    },
    [removeFollower],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderListItem = useCallback(
    (item: FollowerItem) => (
      <MediaListItem
        title={item.username}
        subtitle={item.name}
        imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
        primaryAction={{
          label: "Remove",
          icon: UserRoundMinus,
          onPress: () =>
            actionSheet.show({
              title: "Remove Follower",
              subtitle: `Are you sure you want to remove ${item.username} from your followers?`,
              imageUrl: item.profilePictureUrl ?? DefaultProfilePicture,
              buttonOptions: [
                {
                  text: "Remove",
                  textProps: { color: "$red11" },
                  onPress: () => void handleRemoveFollower(item.userId),
                },
              ],
            }),
        }}
      />
    ),
    [actionSheet, handleRemoveFollower],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <YStack gap="$4">
        <SearchInput
          placeholder="Search followers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />
      </YStack>
    ),
    [searchQuery, setSearchQuery],
  );

  const ListEmptyComponent = useCallback(() => {
    if (isLoading) {
      return (
        <YStack gap="$4">
          {Array.from({ length: 10 }).map((_, index) => (
            <MediaListItemSkeleton key={index} />
          ))}
        </YStack>
      );
    }

    if (followerItems.length === 0) {
      return (
        <YStack flex={1} justifyContent="center">
          <EmptyPlaceholder
            title="No followers"
            subtitle="No followers found."
            icon={<UserRoundPlus />}
          />
        </YStack>
      );
    }

    if (filteredItems.length === 0) {
      return (
        <YStack flex={1}>
          <H6 theme="alt1">No Users Found</H6>
        </YStack>
      );
    }

    return null;
  }, [isLoading, followerItems.length, filteredItems.length]);

  return (
    <FlashList
      data={filteredItems}
      renderItem={({ item }) => renderListItem(item)}
      estimatedItemSize={75}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ItemSeparatorComponent={Spacer}
      ListHeaderComponentStyle={{ marginBottom: getToken("$4", "space") }}
      contentContainerStyle={{
        padding: getToken("$4", "space"),
      }}
      showsVerticalScrollIndicator={false}
      onEndReached={handleOnEndReached}
      onEndReachedThreshold={0.5}
      keyboardShouldPersistTaps="always"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    />
  );
};

export default Followers;
