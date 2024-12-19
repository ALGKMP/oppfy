import React, { useCallback, useMemo, useState } from "react";
import { Keyboard, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { getToken, H5, H6, View, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { SearchInput } from "~/components/Inputs";
import RecommendationList from "~/components/SpecialLists/RecommendationList";
import { MediaListItem, MediaListItemSkeleton } from "~/components/ui";
import { Spacer } from "~/components/ui/Spacer";
import useRouteProfile from "~/hooks/useRouteProfile";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

type SearchResultsData = RouterOutputs["search"]["profilesByUsername"];
type RecommendationsData =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"];

const Search = () => {
  const insets = useSafeAreaInsets();
  const { routeProfile } = useRouteProfile();

  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultsData>([]);

  const { data: recommendationsData, isLoading: isLoadingRecommendationsData } =
    api.contacts.getRecommendationProfilesSelf.useQuery();

  const { mutateAsync: searchProfilesByUsername, isPending: isSearching } =
    api.search.profilesByUsername.useMutation();

  const performSearch = useCallback(
    async (username: string) => {
      setSearchTerm(username);

      if (!username) {
        setSearchResults([]);
        return;
      }

      const results = await searchProfilesByUsername({ username });
      setSearchResults(results);
    },
    [searchProfilesByUsername],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (searchTerm) {
      await performSearch(searchTerm);
    }
    setRefreshing(false);
  }, [searchTerm, performSearch]);

  const renderListItem = useCallback(
    (item: SearchResultsData[0]) => (
      <MediaListItem
        title={item.username}
        subtitle={item.name}
        imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
        onPress={() =>
          routeProfile({ userId: item.userId, username: item.username })
        }
      />
    ),
    [routeProfile],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <YStack gap="$4" pb="$4">
        <SearchInput
          value={searchTerm}
          placeholder="Search by username"
          onChangeText={performSearch}
          onClear={() => {
            setSearchTerm("");
            setSearchResults([]);
          }}
        />

        {!searchTerm && (
          <RecommendationList
            loading={isLoadingRecommendationsData}
            recommendationsData={recommendationsData}
            handleProfileClicked={(userId, username) => {
              routeProfile({ userId, username });
            }}
          />
        )}
      </YStack>
    ),
    [
      searchTerm,
      isLoadingRecommendationsData,
      recommendationsData,
      routeProfile,
      performSearch,
    ],
  );

  const ListEmptyComponent = useCallback(() => {
    if (isSearching) {
      return (
        <YStack gap="$4">
          {Array.from({ length: 10 }).map((_, index) => (
            <MediaListItemSkeleton key={index} />
          ))}
        </YStack>
      );
    }

    if (searchTerm && !searchResults.length) {
      return (
        <YStack flex={1}>
          <H6 theme="alt1">No Users Found</H6>
        </YStack>
      );
    }

    return null;
  }, [isSearching, searchTerm, searchResults.length]);

  return (
    <FlashList
      data={searchTerm ? searchResults : []}
      renderItem={({ item }) => renderListItem(item)}
      estimatedItemSize={75}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ItemSeparatorComponent={Spacer}
      contentContainerStyle={{
        padding: getToken("$4", "space"),
        paddingBottom: insets.bottom,
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
