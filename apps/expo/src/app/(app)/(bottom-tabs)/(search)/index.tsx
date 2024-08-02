import React, { useState } from "react";
import { Keyboard } from "react-native";
import { router } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.png";
import { FlashList } from "@shopify/flash-list";
import {
  H5,
  H6,
  ListItemTitle,
  SizableText,
  Text,
  View,
  YStack,
} from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { SearchInput } from "~/components/Inputs";
import { VirtualizedListItem } from "~/components/ListItems";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

type SearchResultsData = RouterOutputs["search"]["profilesByUsername"];

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultsData>([]);

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
            imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
            onPress={() => {
              router.navigate({
                pathname: "/(search)/profile/[userId]/",
                params: { userId: item.userId, username: item.username },
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
        ListHeaderComponent={<H5 theme="alt1">Suggestions</H5>}
        renderItem={({ item }) => (
          <VirtualizedListItem
            loading={false}
            title={item.username}
            subtitle={item.fullName ?? ""}
            imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
            onPress={() => {
              if (!item.userId) return;
              router.navigate({
                pathname: "/(search)/profile/[userId]/",
                params: { userId: item.userId, username: item.username },
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
            ) : recommendationsData?.length ? (
              renderRecommendations(recommendationsData)
            ) : (
              // TODO: Implement
              <Text>
                let users invite contacts not on the app. or maybe even let them
                post to people not on the app
              </Text>
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
