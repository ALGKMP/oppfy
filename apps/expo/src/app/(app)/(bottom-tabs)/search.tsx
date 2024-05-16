import React, { useEffect, useMemo, useState } from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { UserRoundPlus } from "@tamagui/lucide-icons";
import { debounce } from "lodash";
import { Input, Separator, SizableText, Text, View, YStack } from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import { ActionSheet } from "~/components/Sheets";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

const SEARCH_REFRESH_DELAY = 200;

const Search = () => {
  const headerHeight = useHeaderHeight();

  const [searchResults, setSearchResults] = useState<
    RouterOutputs["search"]["profilesByUsername"]
  >([]);

  const placeholderData = useMemo(() => {
    return Array.from({ length: 20 }, () => null);
  }, []);

  const { isLoading, ...searchProfilesByUsername } =
    api.search.profilesByUsername.useMutation();

  const debouncedSearch = debounce(async (partialUsername: string) => {
    if (!partialUsername) {
      setSearchResults([]);
      return;
    }

    const data = await searchProfilesByUsername.mutateAsync({
      username: partialUsername,
    });
    setSearchResults(data);
  }, SEARCH_REFRESH_DELAY);

  return (
    // <View flex={1} backgroundColor="black" paddingHorizontal="$4">
    <BaseScreenView paddingBottom={0}>
      <YStack flex={1}>
        <Input
          placeholder="Search by username"
          placeholderTextColor="#888"
          color="white"
          onChangeText={debouncedSearch}
        />
        <View flex={1}>
          {isLoading || searchResults.length ? (
            <FlashList
              data={isLoading ? placeholderData : searchResults}
              ItemSeparatorComponent={Separator}
              estimatedItemSize={75}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <SizableText size="$2" theme="alt1" marginBottom="$2">
                  SEARCH RESULTS
                </SizableText>
              }
              renderItem={({ item }) => {
                return (
                  <View>
                    {item === null ? (
                      <VirtualizedListItem
                        loading
                        showSkeletons={{
                          imageUrl: true,
                          title: true,
                          subtitle: true,
                          button: true,
                        }}
                      />
                    ) : (
                      <VirtualizedListItem
                        loading={false}
                        title={item.username}
                        subtitle={item.fullName}
                        imageUrl={item.profilePictureUrl}
                      />
                    )}
                  </View>
                );
              }}
            />
          ) : (
            <View flex={1} justifyContent="center">
              <EmptyPlaceholder
                title="Followers"
                subtitle="You'll see all the people who follow you here."
                icon={<UserRoundPlus />}
              />
            </View>
          )}
        </View>
      </YStack>
    </BaseScreenView>
  );
};

export default Search;
