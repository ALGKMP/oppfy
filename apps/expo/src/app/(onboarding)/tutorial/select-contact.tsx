import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Keyboard, RefreshControl, useWindowDimensions } from "react-native";
import type { Contact } from "expo-contacts";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Phone } from "@tamagui/lucide-icons";
import type { IFuseOptions } from "fuse.js";
import { parsePhoneNumberWithError } from "libphonenumber-js";
import { debounce } from "lodash";
import { getToken } from "tamagui";

import {
  EmptyPlaceholder,
  H1,
  SearchInput,
  Spacer,
  UserCard,
  YStack,
} from "~/components/ui";
import { useContacts } from "~/hooks/contacts";
import useSearch from "~/hooks/useSearch";

const PhoneIcon = React.createElement(Phone);

const SelectContact = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    uri: string;
    width: string;
    height: string;
    type: string;
  }>();

  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - getToken("$8", "space");
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
    searchContacts
  } = useContacts();

  const contacts = data?.pages.flatMap((page) => page.items) ?? [];

  /*   const searchOptions: IFuseOptions<Contact> = {
    keys: [
      "name",
      {
        name: "phoneNumber",
        getFn: (contact) => contact.phoneNumbers?.[0]?.number ?? "",
      },
    ],
    threshold: 0.3,
  };

  const {
    searchQuery,
    setSearchQuery,
    filteredItems: searchResults,
  } = useSearch<Contact>({
    data: contacts,
    fuseOptions: searchOptions,
  }); */

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
        pathname: "/tutorial/media-picker",
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

  const debouncedSearch = useMemo(
     () =>
      debounce(async (text: string) => {
        const contacts = await searchContacts(text);
        setSearchResults(contacts);
      }, 300),
    [],
  );

  useEffect(() => {
    return () => {
      
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
          <EmptyPlaceholder
            icon={PhoneIcon}
            title="No Contacts Found"
            subtitle="We couldn't find any contacts that aren't already on the app. Make sure you have contacts enabled in your settings."
          />
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
