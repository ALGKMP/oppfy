import React, { useState } from "react";
import { Keyboard } from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { H5, H6, View, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { SearchInput } from "~/components/Inputs";
import { VirtualizedListItem } from "~/components/ListItems";
import RecommendationList from "~/components/SpecialLists/RecommendationList";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

type SearchResultsData = RouterOutputs["search"]["profilesByUsername"];
type RecommendationsData =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"];

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultsData>([]);

  const { data: recommendationsData, isLoading: isLoadingRecommendationsData } =
    api.contacts.getRecommendationProfilesSelf.useQuery();

  const { isLoading, mutateAsync: searchProfilesByUsername } =
    api.search.profilesByUsername.useMutation();

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
        keyExtractor={(item) => "search_results_" + item.userId}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<H5 theme="alt1">Search Results</H5>}
        renderItem={({ item }) => (
          <VirtualizedListItem
            loading={false}
            title={item.username}
            subtitle={item.fullName}
            imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
            onPress={() => {
              router.navigate({
                pathname: "/(search)/profile/[userId]",
                params: { userId: item.userId, username: item.username },
              });
            }}
          />
        )}
      />
    </CardContainer>
  );

  const renderRecommendations = (recommendationsData: RecommendationsData) => (
    <RecommendationList
      handleProfileClicked={(userId, username) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push({
          pathname: "/(search)/profile/[userId]",
          params: { userId, username },
        });
      }}
      loading={isLoadingRecommendationsData}
      recommendationsData={recommendationsData}
    />
  );

  return (
    <BaseScreenView scrollable keyboardDismissMode="interactive">
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
            ) : null
          ) : isLoading ? (
            renderLoadingSkeletons()
          ) : searchResults.length ? (
            renderSearchResults()
          ) : (
            <H6 theme="alt1" lineHeight={0}>
              No Users Found
            </H6>
          )}
        </View>
      </YStack>
    </BaseScreenView>
  );
};

export default Search;
