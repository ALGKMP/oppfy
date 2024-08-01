import React, { useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { UserRoundMinus, UserRoundPlus } from "@tamagui/lucide-icons";
import { Button, Input, SizableText, View, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { SearchInput } from "~/components/Inputs";
import { VirtualizedListItem } from "~/components/ListItems";
import { ActionSheet } from "~/components/Sheets";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import useSearch from "~/hooks/useSearch";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

type FriendItem = RouterOutputs["friend"]["paginateFriendsSelf"]["items"][0];

const FriendList = () => {
  const router = useRouter();
  const utils = api.useUtils();

  const [refreshing, setRefreshing] = useState(false);

  const removeFriend = api.friend.removeFriend.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.friend.paginateFriendsSelf.cancel();

      // Get the data from the queryCache
      const prevData = utils.friend.paginateFriendsSelf.getInfiniteData();
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.friend.paginateFriendsSelf.setInfiniteData(
        {},
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
      utils.friend.paginateFriendsSelf.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.friend.paginateFriendsSelf.invalidate();
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
    {
      pageSize: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const friendsItems = useMemo(() => {
    return friendsData?.pages.flatMap((page) => page.items) ?? [];
  }, [friendsData]);

  const { searchQuery, setSearchQuery, filteredItems } = useSearch({
    data: friendsItems,
    keys: ["name", "username"],
  });

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const handleRemoveFriend = async (userId: string) =>
    await removeFriend.mutateAsync({ recipientId: userId });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderLoadingSkeletons = () => (
    <CardContainer>
      {PLACEHOLDER_DATA.map((_, index) => (
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
      ))}
    </CardContainer>
  );

  const renderListItem = (item: FriendItem) => (
    <VirtualizedListItem
      loading={false}
      title={item.username}
      subtitle={item.name}
      imageUrl={item.profilePictureUrl}
      button={
        <ActionSheet
          title="Remove Friend"
          subtitle={`Are you sure you want to remove ${item.username} from your friends?`}
          imageUrl={item.profilePictureUrl}
          trigger={
            <Button size="$3" icon={<UserRoundMinus size="$1" />}>
              Remove
            </Button>
          }
          buttonOptions={[
            {
              text: "Remove",
              textProps: { color: "$red9" },
              onPress: () => void handleRemoveFriend(item.userId),
            },
          ]}
        />
      }
      onPress={() =>
        router.push({
          pathname: "/(profile)/profile/[userId]",
          params: { userId: item.userId, username: item.username },
        })
      }
    />
  );

  const renderFriends = () => (
    <CardContainer>
      <FlashList
        data={filteredItems}
        onRefresh={refetch}
        refreshing={isLoading}
        estimatedItemSize={75}
        onEndReached={handleOnEndReached}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => renderListItem(item)}
      />
    </CardContainer>
  );

  const renderNoResults = () => (
    <View flex={1} justifyContent="center">
      <EmptyPlaceholder
        title="No results"
        subtitle="No friends found."
        icon={<UserRoundPlus />}
      />
    </View>
  );

  if (isLoading) {
    return (
      <BaseScreenView scrollable>{renderLoadingSkeletons()}</BaseScreenView>
    );
  }

  if (friendsItems.length === 0) {
    return <BaseScreenView>{renderNoResults()}</BaseScreenView>;
  }

  return (
    <BaseScreenView
      scrollable
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <YStack gap="$4">
        <SearchInput
          value={searchQuery}
          placeholder="Search friends..."
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />

        {filteredItems.length > 0 ? (
          renderFriends()
        ) : (
          <SizableText lineHeight={0}>No Users Found</SizableText>
        )}
      </YStack>
    </BaseScreenView>
  );
};

export default FriendList;
