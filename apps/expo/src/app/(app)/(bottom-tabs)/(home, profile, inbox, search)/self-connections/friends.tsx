import React, { useState } from "react";
import { RefreshControl } from "react-native";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { UserRoundMinus, UserRoundPlus } from "@tamagui/lucide-icons";
import { getToken, H6, YStack } from "tamagui";

import { SearchInput } from "~/components/Inputs";
import { MediaListItem, useActionSheetController } from "~/components/ui";
import { Spacer } from "~/components/ui/Spacer";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import useRouteProfile from "~/hooks/useRouteProfile";
import useSearch from "~/hooks/useSearch";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type FriendItem = RouterOutputs["friend"]["paginateFriendsSelf"]["items"][0];

const PAGE_SIZE = 20;

const Friends = () => {
  const utils = api.useUtils();
  const actionSheet = useActionSheetController();

  const { routeProfile } = useRouteProfile();

  const [refreshing, setRefreshing] = useState(false);

  const removeFriend = api.friend.removeFriend.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.friend.paginateFriendsSelf.cancel({ pageSize: PAGE_SIZE });

      // Get the data from the queryCache
      const prevData = utils.friend.paginateFriendsSelf.getInfiniteData({
        pageSize: PAGE_SIZE,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.friend.paginateFriendsSelf.setInfiniteData(
        { pageSize: PAGE_SIZE },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.filter(
              (item) => item.userId !== newData.recipientId,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      // Refetch latest data since our optimistic update may be outdated
      void utils.friend.paginateFriendsSelf.invalidate({
        pageSize: PAGE_SIZE,
      });
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.friend.paginateFriendsSelf.invalidate({
        pageSize: PAGE_SIZE,
      });
    },
  });

  const {
    data: friendsData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.friend.paginateFriendsSelf.useInfiniteQuery(
    { pageSize: PAGE_SIZE },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const friendItems = friendsData?.pages.flatMap((page) => page.items) ?? [];

  const { searchQuery, setSearchQuery, filteredItems } = useSearch({
    data: friendItems,
    keys: ["name", "username"],
  });

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const handleRemoveFriend = async (userId: string) => {
    await removeFriend.mutateAsync({ recipientId: userId });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderListItem = (item: FriendItem) => (
    <MediaListItem
      title={item.username}
      subtitle={item.name}
      imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
      primaryAction={{
        label: "Remove",
        icon: UserRoundMinus,
        onPress: () =>
          actionSheet.show({
            title: "Remove Friend",
            subtitle: `Are you sure you want to remove ${item.username} from your friends?`,
            imageUrl: item.profilePictureUrl ?? DefaultProfilePicture,
            buttonOptions: [
              {
                text: "Remove",
                textProps: { color: "$red11" },
                onPress: () => void handleRemoveFriend(item.userId),
              },
            ],
          }),
      }}
      onPress={() =>
        routeProfile({ userId: item.userId, username: item.username })
      }
    />
  );

  const ListHeaderComponent = (
    <YStack gap="$4">
      <SearchInput
        placeholder="Search friends..."
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

    if (friendItems.length === 0) {
      return (
        <YStack flex={1} justifyContent="center">
          <EmptyPlaceholder
            title="No friends"
            subtitle="No friends found."
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

export default Friends;
