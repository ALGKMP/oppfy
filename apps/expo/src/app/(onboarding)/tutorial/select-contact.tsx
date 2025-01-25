import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, useWindowDimensions } from "react-native";
import type { Contact } from "expo-contacts";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Phone } from "@tamagui/lucide-icons";
import type { IFuseOptions } from "fuse.js";
import { parsePhoneNumberWithError } from "libphonenumber-js";
import { getToken, Text } from "tamagui";

import {
  EmptyPlaceholder,
  HeaderTitle,
  ScreenView,
  SearchInput,
  Spacer,
  UserCard,
  YStack,
} from "~/components/ui";
import { useContactsInfinite } from "~/hooks/contacts/useContactsInfinite";
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

  const {
    data,
    isLoading: isLoadingContacts,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useContactsInfinite();

  const contacts = data?.pages.flatMap((page) => page.items) ?? [];

  const searchOptions: IFuseOptions<Contact> = {
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
  });

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
        pathname: "/tutorial/caption",
        params: {
          ...params,
          name: contact.name,
          number: formattedPhoneNumber,
          recipientName: contact.name,
          recipientImage: contact.imageAvailable
            ? contact.image?.uri
            : undefined,
        },
      });
    },
    [router, params],
  );

  const SCREEN_PADDING = getToken("$4", "space") as number;
  const GAP = getToken("$2", "space") as number;
  const TILE_WIDTH = (screenWidth - SCREEN_PADDING * 2 - GAP) / 2; // Account for screen padding and gap between tiles

  return (
    <ScreenView
      backgroundColor="$background"
      padding="$0"
      justifyContent="space-between"
    >
      <YStack flex={1} paddingHorizontal="$4" gap="$4" paddingTop="$8">
        <YStack gap="$2">
          <HeaderTitle>Select a Contact</HeaderTitle>
          <SearchInput
            placeholder="Search contacts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery("")}
          />
        </YStack>
        <FlashList
          data={displayContacts}
          estimatedItemSize={80}
          numColumns={2}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={loadMoreContacts}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={Spacer}
          ListEmptyComponent={() => {
            return isLoadingContacts ? (
              <YStack flex={1} gap="$4" paddingTop="$4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <UserCard.Skeleton key={index} width={cardWidth} />
                ))}
              </YStack>
            ) : (
              <EmptyPlaceholder
                icon={PhoneIcon}
                title="No Contacts Found"
                subtitle="We couldn't find any contacts that aren't already on the app. Try inviting some friends!"
              />
            );
          }}
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
      </YStack>
    </ScreenView>
  );
};

export default SelectContact;
