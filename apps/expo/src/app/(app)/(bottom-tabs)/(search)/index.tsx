import React, { useState } from "react";
import { Keyboard } from "react-native";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { ListItemTitle, SizableText, View, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { SearchInput } from "~/components/Inputs";
import { VirtualizedListItem } from "~/components/ListItems";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    RouterOutputs["search"]["profilesByUsername"]
  >([]);
  type RecommendationsData =
    RouterOutputs["contacts"]["getRecommendationProfilesSelf"];

  const { isLoading, mutateAsync: searchProfilesByUsername } =
    api.search.profilesByUsername.useMutation();

  const { data: recommendationsData, isLoading: isLoadingRecommendationsData } =
    api.contacts.getRecommendationProfilesSelf.useQuery();

  const performSearch = async (partialUsername: string) => {
    setSearchTerm(partialUsername);

    if (!partialUsername) {
      setSearchResults([]);
      return;
    }

    const data = await searchProfilesByUsername({
      username: partialUsername,
    });
    setSearchResults(data);
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

  const renderSearchResults = () => (
    <CardContainer>
      <FlashList
        data={searchResults}
        estimatedItemSize={75}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={Keyboard.dismiss}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<ListItemTitle>Search Results</ListItemTitle>}
        renderItem={({ item }) => (
          <VirtualizedListItem
            loading={false}
            title={item.username}
            subtitle={item.fullName}
            imageUrl={item.profilePictureUrl}
            onPress={() => {
              if (!item.id) return;
              router.navigate({
                pathname: "/(search)/profile/[profileId]/",
                params: { profileId: String(item.id) },
              });
            }}
          />
        )}
      />
    </CardContainer>
  );

  const renderRecommendations = (recs: RecommendationsData) => (
    <CardContainer>
      <FlashList
        data={recs}
        estimatedItemSize={75}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={Keyboard.dismiss}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<ListItemTitle>Suggested profiles</ListItemTitle>}
        renderItem={({ item }) => (
          <VirtualizedListItem
            loading={false}
            title={item.username}
            subtitle={item.fullName!}
            imageUrl={item.profilePictureUrl}
            onPress={() => {
              if (!item.profileId) return;
              router.navigate({
                pathname: "/(search)/profile/[profileId]/",
                params: { profileId: String(item.profileId) },
              });
            }}
          />
        )}
      />
    </CardContainer>
  );

  return (
    <BaseScreenView scrollable>
      <YStack gap="$4">
        <SearchInput
          value={searchTerm}
          placeholder="Search by username"
          onChangeText={performSearch}
          onClear={() => setSearchTerm("")}
        />
        <View>
          {!searchTerm ? (
            isLoadingRecommendationsData ? (
              renderLoadingSkeletons()
            ) : (
              renderRecommendations(recommendationsData!)
            )
          ) : isLoading ? (
            renderLoadingSkeletons()
          ) : searchResults.length ? (
            renderSearchResults()
          ) : (
            <SizableText lineHeight={0}>No Users Found</SizableText>
          )}
        </View>
      </YStack>
    </BaseScreenView>
  );
};

export default Search;
