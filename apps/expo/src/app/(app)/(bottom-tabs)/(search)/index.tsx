import React, { useState } from "react";
import { Keyboard, RefreshControl } from "react-native";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { getToken, YStack } from "tamagui";

import GridSuggestions from "~/components/GridSuggestions";
import { HeaderTitle, MediaListItem, SearchInput } from "~/components/ui";
import { Spacer } from "~/components/ui/Spacer";
import useRouteProfile from "~/hooks/useRouteProfile";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

type SearchResultItem = RouterOutputs["search"]["profilesByUsername"][number];

const Search = () => {
  const { routeProfile } = useRouteProfile();

  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);

  const { mutateAsync: searchProfilesByUsername, isPending: isSearching } =
    api.search.profilesByUsername.useMutation();

  const performSearch = async (username: string) => {
    setSearchTerm(username);

    if (!username) {
      setSearchResults([]);
      return;
    }

    const results = await searchProfilesByUsername({ username });
    setSearchResults(results);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (searchTerm) {
      await performSearch(searchTerm);
    }
    setRefreshing(false);
  };

  const renderListItem = (item: SearchResultItem) => (
    <MediaListItem
      title={item.username}
      subtitle={item.name}
      imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
      onPress={() =>
        routeProfile({ userId: item.userId, username: item.username })
      }
    />
  );

  const ListHeaderComponent = (
    <SearchInput
      value={searchTerm}
      placeholder="Search by username"
      onChangeText={performSearch}
      onClear={() => {
        setSearchTerm("");
        setSearchResults([]);
      }}
    />
  );

  const ListFooterComponent = () => {
    if (!searchTerm) {
      return <GridSuggestions />;
    }

    return null;
  };

  const ListEmptyComponent = () => {
    if (isSearching) {
      return (
        <YStack gap="$2.5">
          {Array.from({ length: 20 }).map((_, index) => (
            <MediaListItem.Skeleton key={index} />
          ))}
        </YStack>
      );
    }

    if (searchTerm && !searchResults.length) {
      return <HeaderTitle>No Users Found</HeaderTitle>;
    }

    return null;
  };

  return (
    <FlashList
      data={searchTerm ? searchResults : []}
      renderItem={({ item }) => renderListItem(item)}
      estimatedItemSize={75}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      ItemSeparatorComponent={Spacer}
      ListHeaderComponentStyle={{
        paddingTop: getToken("$2", "space") as number,
        paddingBottom: getToken("$3", "space") as number,
      }}
      contentContainerStyle={{
        paddingBottom: getToken("$4", "space") as number,
        paddingHorizontal: getToken("$4", "space") as number,
      }}
      showsVerticalScrollIndicator={false}
      onScrollBeginDrag={Keyboard.dismiss}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    />
  );
};

export default Search;
