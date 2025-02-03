import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Linking,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import type { Contact } from "expo-contacts";
import { PermissionStatus } from "expo-media-library";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Phone, PhoneMissed, UserRoundX } from "@tamagui/lucide-icons";
import type { IFuseOptions } from "fuse.js";
import { CountryCode, parsePhoneNumberWithError } from "libphonenumber-js";
import { debounce } from "lodash";
import { getToken, Theme } from "tamagui";

import {
  EmptyPlaceholder,
  H1,
  HeaderTitle,
  SearchInput,
  Spacer,
  useAlertDialogController,
  UserCard,
  YStack,
} from "~/components/ui";
import { useContacts } from "~/hooks/contacts";
import useSearch from "~/hooks/useSearch";

interface ListItem {
  id: string;
  contact: Contact;
}

const SelectContact = () => {
  const router = useRouter();
  const alertDialog = useAlertDialogController();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedContacts, setSearchedContacts] = useState<Contact[]>([]);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);

  // Constants for layout calculations
  const SCREEN_PADDING = getToken("$4", "space") as number;
  const GAP = getToken("$2", "space") as number;
  const SCREEN_WIDTH = Dimensions.get("window").width;
  const TILE_WIDTH = (SCREEN_WIDTH - SCREEN_PADDING * 2 - GAP) / 2;

  const {
    contactsPaginatedQuery: {
      data: contactsData,
      isLoading: isLoadingContacts,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage,
      refetch,
    },
    searchContacts,
    parsePhoneNumberEntry,
  } = useContacts();

  const contacts = useMemo(
    () => contactsData?.pages.flatMap((page) => page.items) ?? [],
    [contactsData],
  );

  const debouncedSearchContacts = useMemo(
    () =>
      debounce(async (text: string) => {
        setIsSearchingContacts(true);
        const contacts = await searchContacts(text);
        setSearchedContacts(contacts);
        setIsSearchingContacts(false);
      }, 100),
    [],
  );

  useEffect(() => {
    return () => debouncedSearchContacts.cancel();
  }, [debouncedSearchContacts]);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      void debouncedSearchContacts(text);
    },
    [debouncedSearchContacts],
  );

  const displayItems = useMemo(() => {
    const contactsToShow = searchQuery ? searchedContacts : contacts;
    return contactsToShow.map((contact) => ({
      id:
        contact.id ??
        contact.phoneNumbers?.[0]?.number ??
        Math.random().toString(),
      contact,
    }));
  }, [searchQuery, searchedContacts, contacts]);

  const onContactSelected = useCallback(
    async (contact: Contact) => {
      const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();

      if (status === PermissionStatus.GRANTED) {
        try {
          const formattedPhoneNumber = parsePhoneNumberEntry(
            contact.phoneNumbers?.[0],
          );

          if (formattedPhoneNumber === null) return;

          router.push({
            pathname: "/tutorial/album-picker",
            params: {
              name: encodeURIComponent(contact.name),
              number: encodeURIComponent(formattedPhoneNumber),
              recipientName: encodeURIComponent(contact.name),
              recipientImage:
                contact.imageAvailable && contact.image?.uri
                  ? encodeURIComponent(contact.image.uri)
                  : undefined,
            },
          });
          return;
        } catch (error) {
          console.error("Error formatting phone number:", error);
        }
      }

      if (canAskAgain) {
        const { granted } = await MediaLibrary.requestPermissionsAsync();
        if (granted) {
          router.push(
            "/(app)/(bottom-tabs)/(camera)/(media-picker)/album-picker",
          );
          return;
        }
      }

      const confirmed = await alertDialog.show({
        title: "Media Library Permission",
        subtitle: "Please grant permission to access your media.",
        cancelText: "OK",
        acceptText: "Settings",
        acceptTextProps: {
          color: "$blue9",
        },
        cancelTextProps: {
          color: "$color",
        },
      });

      if (confirmed) {
        await Linking.openSettings();
      }
    },
    [alertDialog, parsePhoneNumberEntry, router],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleOnEndReached = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage && !searchQuery) {
      void fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage, searchQuery]);

  const renderItem = useCallback(
    ({ item, index }: { item: ListItem; index: number }) => (
      <UserCard
        userId={item.id}
        username={item.contact.name}
        profilePictureUrl={
          item.contact.imageAvailable && item.contact.image?.uri
            ? item.contact.image.uri
            : null
        }
        bio={item.contact.phoneNumbers?.[0]?.number}
        width={TILE_WIDTH}
        index={index}
        onPress={() => onContactSelected(item.contact)}
        actionButton={{
          label: "Select",
          onPress: () => void onContactSelected(item.contact),
          icon: "add",
        }}
      />
    ),
    [TILE_WIDTH, onContactSelected],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <YStack gap="$4">
        <H1 textAlign="center" color="$color">
          Post for someone not on the app!
        </H1>
        <Theme name="light">
          <SearchInput
            placeholder="Search contacts..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            onClear={() => {
              debouncedSearchContacts.cancel();
              setSearchQuery("");
              setSearchedContacts([]);
            }}
          />
        </Theme>
      </YStack>
    ),
    [searchQuery, handleSearchChange, debouncedSearchContacts],
  );

  const ListEmptyComponent = useCallback(() => {
    const isLoading = isLoadingContacts || isSearchingContacts;

    if (isLoading) {
      return (
        <YStack gap="$2.5" flexDirection="row" flexWrap="wrap">
          {Array.from({ length: 6 }).map((_, index) => (
            <UserCard.Skeleton key={index} width={TILE_WIDTH} />
          ))}
        </YStack>
      );
    }

    if (contacts.length === 0) {
      return (
        <YStack flex={1} justifyContent="center">
          <EmptyPlaceholder
            title="No Contacts Found"
            subtitle="We couldn't find any contacts on your device."
            icon={<UserRoundX />}
          />
        </YStack>
      );
    }

    if (searchQuery && displayItems.length === 0) {
      return (
        <YStack flex={1}>
          <HeaderTitle>No Results Found</HeaderTitle>
        </YStack>
      );
    }

    return null;
  }, [
    isLoadingContacts,
    isSearchingContacts,
    contacts.length,
    searchQuery,
    displayItems.length,
    TILE_WIDTH,
  ]);

  const keyExtractor = useCallback((item: ListItem) => item.id, []);

  return (
    <FlashList
      data={displayItems}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={80}
      numColumns={2}
      ItemSeparatorComponent={Spacer}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      onScrollBeginDrag={Keyboard.dismiss}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponentStyle={{
        marginBottom: getToken("$4", "space") as number,
      }}
      contentContainerStyle={{
        padding: SCREEN_PADDING,
        paddingHorizontal: SCREEN_PADDING - GAP / 2,
      }}
      onEndReached={handleOnEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    />
  );
};

export default SelectContact;
