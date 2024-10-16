import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { UserRoundMinus, UserRoundPlus } from "@tamagui/lucide-icons";
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

type FollowerItem =
  RouterOutputs["follow"]["paginateFollowersSelf"]["items"][0];

const FollowerList = () => {
  const router = useRouter();
  const utils = api.useUtils();

  const [refreshing, setRefreshing] = useState(false);

  const removeFollower = api.follow.removeFollower.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.follow.paginateFollowersSelf.cancel();

      // Get the data from the queryCache
      const prevData = utils.follow.paginateFollowersSelf.getInfiniteData();
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.follow.paginateFollowersSelf.setInfiniteData(
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
      utils.follow.paginateFollowersSelf.setInfiniteData({}, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.follow.paginateFollowersSelf.invalidate();
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
    {
      pageSize: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const followerItems = useMemo(() => {
    return followersData?.pages.flatMap((page) => page.items) ?? [];
  }, [followersData]);

  const { searchQuery, setSearchQuery, filteredItems } = useSearch({
    data: followerItems,
    keys: ["name", "username"],
  });

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const handleRemoveFollower = async (userId: string) =>
    await removeFollower.mutateAsync({ userId });

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

  const renderListItem = useCallback((item: FollowerItem) => (
    <VirtualizedListItem
      loading={false}
      title={item.username}
      subtitle={item.name}
      imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
      button={
        <ActionSheet
          title="Remove Follower"
          subtitle={`Are you sure you want to remove ${item.username} from your followers?`}
          imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
          trigger={
            <Button size="$3.5" icon={<UserRoundMinus size="$1" />}>
              Remove
            </Button>
          }
          buttonOptions={[
            {
              text: "Remove",
              textProps: { color: "$red9" },
              onPress: () => void handleRemoveFollower(item.userId),
            },
          ]}
        />
      }
      onPress={() =>
        router.push({
          pathname: "/profile/[userId]",
          params: { userId: item.userId },
        })
      }
      />
    ),
    [router],
  );

  const renderFollowers = useCallback(() => (
    <CardContainer>
      <H5 theme="alt1">Followers</H5>
      <FlashList
        data={filteredItems}
        onRefresh={refetch}
        refreshing={isLoading}
        keyExtractor={(item) => "followers_list_" + item.userId}
        estimatedItemSize={75}
        onEndReached={handleOnEndReached}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => renderListItem(item)}
      />
    </CardContainer>
  ), [filteredItems, renderListItem]);

  const renderNoResults = () => (
    <View flex={1} justifyContent="center">
      <EmptyPlaceholder
        title="No results"
        subtitle="No followers found."
        icon={<UserRoundPlus />}
      />
    </View>
  );

  if (isLoading) {
    return (
      <BaseScreenView scrollable>{renderLoadingSkeletons()}</BaseScreenView>
    );
  }

  if (followerItems.length === 0) {
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
          placeholder="Search followers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />

        {filteredItems.length > 0 ? (
          renderFollowers()
        ) : (
          <H6 theme="alt1" lineHeight={0}>
            No Users Found
          </H6>
        )}
      </YStack>
    </BaseScreenView>
  );
};

export default FollowerList;
