import React, { useMemo, useState } from "react";
import { Keyboard } from "react-native";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { debounce } from "lodash";
import { Input, Separator, SizableText, View, YStack } from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

const SEARCH_REFRESH_DELAY = 200;

const Search = () => {
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
    <BaseScreenView paddingBottom={0}>
      <YStack flex={1} gap="$2">
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
              onScrollBeginDrag={Keyboard.dismiss}
              keyboardShouldPersistTaps="handled"
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
                        onPress={() => {
                          if (!item.id) return;
                          router.navigate({
                            pathname: "/profile/[profile-id]/",
                            params: { profileId: String(item.id) },
                          });
                        }}
                      />
                    )}
                  </View>
                );
              }}
            />
          ) : (
            <View flex={1} justifyContent="center">
              {/* TODO: We'll need to add user recommendations */}
            </View>
          )}
        </View>
      </YStack>
    </BaseScreenView>
  );
};

export default Search;
