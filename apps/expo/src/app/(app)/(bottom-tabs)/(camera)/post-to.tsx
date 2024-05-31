import React, { useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { ArrowBigLeft, UserRoundX } from "@tamagui/lucide-icons";
import { Button, Separator, SizableText, Text, View, XStack } from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const PostTo = () => {
  const { uri, type } = useLocalSearchParams<{
    uri: string;
    type: "photo" | "video";
  }>();

  const router = useRouter();
  const headerHeight = useHeaderHeight();

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

  const friendItems = useMemo(
    () => friendsData?.pages.flatMap((page) => page.items) ?? [],
    [friendsData],
  );
  const itemCount = useMemo(
    () =>
      friendsData?.pages.reduce(
        (total, page) => total + page.items.length,
        0,
      ) ?? 0,
    [friendsData],
  );

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  if (isLoading) {
    return (
      <BaseScreenView paddingBottom={0}>
        <FlashList
          data={PLACEHOLDER_DATA}
          ItemSeparatorComponent={Separator}
          estimatedItemSize={75}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<ListHeader title="FOLLOWERS" />}
          renderItem={() => (
            <VirtualizedListItem
              loading
              showSkeletons={{
                imageUrl: true,
                title: true,
                subtitle: true,
              }}
            />
          )}
        />
      </BaseScreenView>
    );
  }

  if (itemCount === 0) {
    return (
      <BaseScreenView>
        <View flex={1} justifyContent="center" bottom={headerHeight}>
          <EmptyPlaceholder
            title="Nowhere to post"
            subtitle="No friends yet, once you’ve added someone they’ll show up here."
            icon={<UserRoundX />}
          />
        </View>
      </BaseScreenView>
    );
  }

  return (
    <BaseScreenView paddingBottom={0} safeAreaEdges={["bottom"]}>
      <FlashList
        data={friendItems}
        onRefresh={refetch}
        refreshing={isLoading}
        ItemSeparatorComponent={Separator}
        estimatedItemSize={75}
        onEndReached={handleOnEndReached}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<ListHeader title="Friends" />}
        renderItem={({ item }) => (
          <VirtualizedListItem
            loading={false}
            title={item.username}
            subtitle={item.name}
            imageUrl={item.profilePictureUrl}
            onPress={() => void }
          />
        )}
      />

      <XStack
        paddingTop="$4"
        paddingHorizontal="$4"
        justifyContent="space-evenly"
        backgroundColor={"$background"}
        gap="$6"
      >
        <Button
          flex={2}
          size={"$5"}
          borderRadius="$8"
          icon={ArrowBigLeft}
          onPress={() => router.back()}
        >
          Back
        </Button>
      </XStack>
    </BaseScreenView>
  );
};

interface ListHeaderProps {
  title: string;
}

const ListHeader = ({ title }: ListHeaderProps) => (
  <SizableText size="$2" theme="alt1" marginBottom="$2">
    {title}
  </SizableText>
);

export default PostTo;
