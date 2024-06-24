import React, { useState } from "react";
import { Keyboard } from "react-native";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { UserRoundX } from "@tamagui/lucide-icons";
import { Input, ListItemTitle, SizableText, View, YStack } from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { VirtualizedListItem } from "~/components/ListItems";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    RouterOutputs["search"]["profilesByUsername"]
  >([]);

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
      {PLACEHOLDER_DATA.map((item, index) => (
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
                pathname: "/(search)/profile/[profile-id]/",
                params: { profileId: String(item.id) },
              });
            }}
          />
        )}
      />
    </CardContainer>
  );

  const renderRecommendations = () => (
    <CardContainer>
      <View>
        <ListItemTitle>Recommendations</ListItemTitle>
        <SizableText>@oxy show suggestions here</SizableText>
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
        <Input placeholder="Search by username" onChangeText={performSearch} />
        <View>
          {!searchTerm
            ? renderRecommendations()
            : isLoading
              ? renderLoadingSkeletons()
              : searchResults.length
                ? renderSearchResults()
                : renderNoResults()}
        </View>
      </YStack>
    </BaseScreenView>
  );
};

export default Search;
