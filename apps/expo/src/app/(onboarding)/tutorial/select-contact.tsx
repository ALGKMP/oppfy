import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Keyboard,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import type { Contact } from "expo-contacts";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Phone, PhoneMissed } from "@tamagui/lucide-icons";
import type { IFuseOptions } from "fuse.js";
import { parsePhoneNumberWithError } from "libphonenumber-js";
import { debounce } from "lodash";
import { getToken } from "tamagui";

import {
  EmptyPlaceholder,
  H1,
  HeaderTitle,
  SearchInput,
  Spacer,
  UserCard,
  YStack,
} from "~/components/ui";
import { useContacts } from "~/hooks/contacts";
import useSearch from "~/hooks/useSearch";

const { width: screenWidth } = Dimensions.get("window");

const SelectContact = () => {
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);

  const {
    contactsPaginatedQuery: {
      data,
      isLoading: isLoadingContacts,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage,
      refetch,
    },
    searchContacts,
  } = useContacts();

  const contacts = data?.pages.flatMap((page) => page.items) ?? [];

  const displayContacts = searchQuery ? searchResults : contacts;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const loadMoreContacts = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onContactSelected = useCallback(
    (contact: Contact) => {
      if (!contact.phoneNumbers?.[0]?.number) return;

      const formattedPhoneNumber = parsePhoneNumberWithError(
        contact.phoneNumbers[0].number,
      ).format("E.164");

      router.push({
        pathname: "/tutorial/album-picker",
        params: {
          name: contact.name,
          number: formattedPhoneNumber,
          recipientName: contact.name,
          recipientImage: contact.imageAvailable
            ? contact.image?.uri
            : undefined,
        },
      });
    },
    [router],
  );

  const SCREEN_PADDING = getToken("$4", "space") as number;
  const GAP = getToken("$2", "space") as number;
  const TILE_WIDTH = (screenWidth - SCREEN_PADDING * 2 - GAP) / 2; // Account for screen padding and gap between tiles

  const debouncedSearch = debounce(async (text: string) => {
    const contacts = await searchContacts(text);
    setSearchResults(contacts);
  }, 100);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <FlashList
      data={displayContacts}
      estimatedItemSize={80}
      numColumns={2}
      contentContainerStyle={{
        paddingHorizontal: getToken("$4", "space") as number,
        paddingTop: getToken("$6", "space") as number,
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      onScrollBeginDrag={Keyboard.dismiss}
      onEndReached={loadMoreContacts}
      onEndReachedThreshold={0.5}
      ItemSeparatorComponent={Spacer}
      ListEmptyComponent={() => {
        return isLoadingContacts ? (
          <YStack flex={1} flexDirection="row" flexWrap="wrap" gap={GAP}>
            {Array.from({ length: 6 }).map((_, index) => (
              <UserCard.Skeleton key={index} width={TILE_WIDTH} />
            ))}
          </YStack>
        ) : (
          <HeaderTitle>No Users Found</HeaderTitle>
        );
      }}
      ListHeaderComponentStyle={{
        marginBottom: getToken("$4", "space") as number,
      }}
      ListHeaderComponent={useMemo(() => {
        return (
          <YStack gap="$4">
            <H1 textAlign="center" color="$color">
              Choose a Contact Not On The App!
            </H1>
            <YStack gap="$2">
              <SearchInput
                placeholder="Search contacts..."
                value={searchQuery}
                onChangeText={(txt) => {
                  //TODO: mak ebetter
                  setSearchQuery(txt);
                  void debouncedSearch(txt);
                }}
                onClear={() => {
                  debouncedSearch.cancel();
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              />
            </YStack>
          </YStack>
        );
      }, [searchQuery, debouncedSearch])}
      renderItem={({ item: contact, index }) => (
        <UserCard
          userId={contact.id ?? Math.random().toString()}
          username={contact.name}
          profilePictureUrl={
            contact.imageAvailable && contact.image?.uri
              ? contact.image.uri
              : null
          }
          bio={contact.phoneNumbers?.[0]?.number ?? undefined}
          width={TILE_WIDTH}
          index={index}
          onPress={() => onContactSelected(contact)}
          actionButton={{
            label: "Select",
            onPress: () => onContactSelected(contact),
            icon: "add",
          }}
        />
      )}
    />
  );
};

export default SelectContact;
