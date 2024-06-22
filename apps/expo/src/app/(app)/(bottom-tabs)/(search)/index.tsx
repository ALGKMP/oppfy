import React, { useMemo, useState } from "react";
import { Keyboard } from "react-native";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { UserRoundX } from "@tamagui/lucide-icons";
import { debounce } from "lodash";
import {
  Input,
  ListItemTitle,
  Separator,
  SizableText,
  View,
  YStack,
} from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { VirtualizedListItem } from "~/components/ListItems";
import StatusRenderer from "~/components/StatusRenderer";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const SEARCH_REFRESH_DELAY = 200;

const Search = () => {
  const [searchResults, setSearchResults] = useState<
    RouterOutputs["search"]["profilesByUsername"]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const placeholderData = useMemo(() => {
    return Array.from({ length: 20 }, () => null);
  }, []);

  const { isLoading, ...searchProfilesByUsername } =
    api.search.profilesByUsername.useMutation();

  const debouncedSearch = debounce(async (partialUsername: string) => {
    setIsSearching(true);

    if (!partialUsername) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const data = await searchProfilesByUsername.mutateAsync({
      username: partialUsername,
    });
    setSearchResults(data);
  }, SEARCH_REFRESH_DELAY);

  const renderSearchResults = () => (
    <CardContainer>
      <FlashList
        data={isLoading ? placeholderData : searchResults}
        ItemSeparatorComponent={Separator}
        estimatedItemSize={75}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={Keyboard.dismiss}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<ListItemTitle>Search Results</ListItemTitle>}
        renderItem={({ item }) => (
          <View>
            <StatusRenderer
              data={item}
              loadingComponent={
                <VirtualizedListItem
                  loading
                  showSkeletons={{
                    imageUrl: true,
                    title: true,
                    subtitle: true,
                    button: true,
                  }}
                />
              }
              successComponent={(item) => (
                <VirtualizedListItem
                  loading={false}
                  title={item.username}
                  subtitle={item.fullName}
                  imageUrl={item.profilePictureUrl}
                  onPress={() => {
                    if (!item.id) return;
                    router.navigate({
                      pathname: "/(search)/profile/[profile-id]/",
                      params: { profileId: String(item.id) },
                    });
                  }}
                />
              )}
            />
          </View>
        )}
      />
    </CardContainer>
  );

  const renderRecommendations = () => (
    <CardContainer>
      <View>
        <ListItemTitle>Recommendations</ListItemTitle>
      </View>
    </CardContainer>
  );

  const renderNoResults = () => (
    <EmptyPlaceholder
      title="No results found."
      subtitle="Try searching for another username."
      icon={<UserRoundX />}
    />
  );

  return (
    <BaseScreenView scrollable>
      <YStack gap="$4">
        <Input
          placeholder="Search by username"
          placeholderTextColor="#888"
          color="white"
          onChangeText={debouncedSearch}
        />
        <View>
          {!isSearching
            ? renderRecommendations()
            : searchResults.length
              ? renderSearchResults()
              : renderNoResults()}
        </View>
      </YStack>
    </BaseScreenView>
  );
};

export default Search;
