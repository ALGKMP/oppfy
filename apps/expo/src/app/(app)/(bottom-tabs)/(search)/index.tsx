import React, { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
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
  const navigation = useNavigation();

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
                        title={item.username ?? undefined}
                        subtitle={item.fullName ?? undefined}
                        imageUrl={item.profilePictureUrl}
                        onPress={() =>
                          router.push("/(app)/(bottom-tabs)/(home)")
                          // router.navigate({
                          //   pathname: "/(app)/(bottom-tabs)/(other-profile)",
                          //   params: {
                          //     profileId: String(item.id),
                          //     fullName: item.fullName ?? "",
                          //     username: item.username ?? "",
                          //     bio: item.bio ?? "",
                          //     profilePictureUrl: item.profilePictureUrl,
                          //   },
                          // })
                        }
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
