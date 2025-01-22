import React, { useState } from "react";
import { RefreshControl } from "react-native";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { UserRoundX } from "@tamagui/lucide-icons";
import { getToken, H6, YStack } from "tamagui";

import {
  EmptyPlaceholder,
  HeaderTitle,
  MediaListItem,
  SearchInput,
  useActionSheetController,
} from "~/components/ui";
import { Spacer } from "~/components/ui/Spacer";
import useSearch from "~/hooks/useSearch";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type BlockedUserItem =
  RouterOutputs["block"]["paginateBlockedUsers"]["items"][0];

const PAGE_SIZE = 20;

const Blocked = () => {
  const utils = api.useUtils();
  const actionSheet = useActionSheetController();

  const [refreshing, setRefreshing] = useState(false);

  const unblockUser = api.block.unblockUser.useMutation({
    onMutate: async (newData) => {
      await utils.block.paginateBlockedUsers.cancel({ pageSize: PAGE_SIZE });
      const prevData = utils.block.paginateBlockedUsers.getInfiniteData({
        pageSize: PAGE_SIZE,
      });
      if (prevData === undefined) return;

      utils.block.paginateBlockedUsers.setInfiniteData(
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
      utils.block.paginateBlockedUsers.setInfiniteData(
        { pageSize: PAGE_SIZE },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      await utils.block.paginateBlockedUsers.invalidate({
        pageSize: PAGE_SIZE,
      });
    },
  });

  const {
    data: blockedUsersData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.block.paginateBlockedUsers.useInfiniteQuery(
    { pageSize: PAGE_SIZE },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const blockedUsersItems =
    blockedUsersData?.pages.flatMap((page) => page.items) ?? [];

  const { searchQuery, setSearchQuery, filteredItems } =
    useSearch<BlockedUserItem>({
      data: blockedUsersItems,
      fuseOptions: {
        keys: ["name", "username"],
        threshold: 0.3,
      },
    });

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const handleUnblock = async (userId: string) => {
    await unblockUser.mutateAsync({ userId });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderListItem = (item: BlockedUserItem) => (
    <MediaListItem
      title={item.username}
      subtitle={item.name}
      imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
      primaryAction={{
        label: "Unblock",
        icon: UserRoundX,
        onPress: () =>
          actionSheet.show({
            title: "Unblock User",
            subtitle: `Are you sure you want to unblock ${item.username}?`,
            imageUrl: item.profilePictureUrl ?? DefaultProfilePicture,
            buttonOptions: [
              {
                text: "Unblock",
                textProps: { color: "$red11" },
                onPress: () => void handleUnblock(item.userId),
              },
            ],
          }),
      }}
    />
  );

  const ListHeaderComponent = () => (
    <YStack gap="$4">
      <SearchInput
        placeholder="Search blocked users..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery("")}
      />
    </YStack>
  );

  const ListEmptyComponent = () => {
    if (isLoading) {
      return (
        <YStack gap="$2.5">
          {Array.from({ length: 20 }).map((_, index) => (
            <MediaListItem.Skeleton key={index} />
          ))}
        </YStack>
      );
    }

    if (blockedUsersItems.length === 0) {
      return (
        <YStack flex={1} justifyContent="center">
          <EmptyPlaceholder
            title="No blocked users"
            subtitle="You haven't blocked any users."
            icon={<UserRoundX />}
          />
        </YStack>
      );
    }

    if (filteredItems.length === 0) {
      return (
        <YStack flex={1}>
          <HeaderTitle>No Users Found</HeaderTitle>
        </YStack>
      );
    }

    return null;
  };

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

export default Blocked;
