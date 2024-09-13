import React, { useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { UserRoundX } from "@tamagui/lucide-icons";
import { Button, H5, H6, View, YStack } from "tamagui";

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

type BlockedUserItem =
  RouterOutputs["block"]["paginateBlockedUsers"]["items"][0];

const BlockedUsers = () => {
  const utils = api.useUtils();
  const [refreshing, setRefreshing] = useState(false);

  const unblockUser = api.block.unblockUser.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.block.paginateBlockedUsers.cancel();

      // Get the data from the queryCache
      const prevData = utils.block.paginateBlockedUsers.getInfiniteData();
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.block.paginateBlockedUsers.setInfiniteData(
        {},
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
      utils.block.paginateBlockedUsers.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.block.paginateBlockedUsers.invalidate();
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
    {
      pageSize: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const blockedUsersItems = useMemo(() => {
    return blockedUsersData?.pages.flatMap((page) => page.items) ?? [];
  }, [blockedUsersData]);

  const { searchQuery, setSearchQuery, filteredItems } = useSearch({
    data: blockedUsersItems,
    keys: ["name", "username"],
  });

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const handleUnblock = async (userId: string) => {
    await unblockUser.mutateAsync({
      userId,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderLoadingSkeletons = () => (
    <CardContainer>
      <H5 theme="alt1">Blocked</H5>
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

  const renderListItem = (item: BlockedUserItem) => (
    <VirtualizedListItem
      loading={false}
      title={item.username}
      subtitle={item.name}
      imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
      button={
        <ActionSheet
          title={`Unblock ${item.username}`}
          subtitle={`Are you sure you want to unblock ${item.username}?`}
          imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
          trigger={
            <Button size="$3.5" icon={<UserRoundX size="$1" />}>
              Unblock
            </Button>
          }
          buttonOptions={[
            {
              text: "Unblock",
              textProps: { color: "$red9" },
              onPress: () => void handleUnblock(item.userId),
            },
          ]}
        />
      }
    />
  );

  const renderBlockedUsers = () => (
    <CardContainer>
      <H5 theme="alt1">Blocked</H5>
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
        subtitle="No blocked users found."
        icon={<UserRoundX />}
      />
    </View>
  );

  if (isLoading) {
    return (
      <BaseScreenView scrollable>{renderLoadingSkeletons()}</BaseScreenView>
    );
  }

  if (blockedUsersItems.length === 0) {
    return (
      <BaseScreenView
        scrollable
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderNoResults()}
      </BaseScreenView>
    );
  }

  return (
    <BaseScreenView
      scrollable
      keyboardDismissMode="interactive"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <YStack gap="$4">
        <SearchInput
          placeholder="Search blocked users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />

        {filteredItems.length > 0 ? (
          renderBlockedUsers()
        ) : (
          <H6 theme="alt1" lineHeight={0}>
            No Users Found
          </H6>
        )}
      </YStack>
    </BaseScreenView>
  );
};

export default BlockedUsers;
