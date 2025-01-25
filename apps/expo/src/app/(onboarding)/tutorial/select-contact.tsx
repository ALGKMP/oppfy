import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl } from "react-native";
import type { Contact } from "expo-contacts";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Phone } from "@tamagui/lucide-icons";
import { parsePhoneNumberWithError } from "libphonenumber-js";
import { getToken } from "tamagui";

import {
  EmptyPlaceholder,
  HeaderTitle,
  ScreenView,
  UserCard,
  YStack,
} from "~/components/ui";
import { useContacts } from "~/hooks/contacts";

const INITIAL_PAGE_SIZE = 20;
const ADDITIONAL_PAGE_SIZE = 10;

const PhoneIcon = React.createElement(Phone);

const SelectContact = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    uri: string;
    width: string;
    height: string;
    type: string;
  }>();

  const { getDeviceContactsNotOnApp } = useContacts();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [visibleContacts, setVisibleContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [contactsPage, setContactsPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      const contactsNotOnApp = await getDeviceContactsNotOnApp();
      setContacts(contactsNotOnApp);
      setVisibleContacts(contactsNotOnApp.slice(0, INITIAL_PAGE_SIZE));
    } catch (error) {
      console.error("Failed to load contacts:", error);
      setContacts([]);
      setVisibleContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [getDeviceContactsNotOnApp]);

  const loadMoreContacts = useCallback(() => {
    if (visibleContacts.length >= contacts.length) return;

    const nextPage = contactsPage + 1;
    const newVisibleContacts = contacts.slice(
      0,
      INITIAL_PAGE_SIZE + nextPage * ADDITIONAL_PAGE_SIZE,
    );
    setVisibleContacts(newVisibleContacts);
    setContactsPage(nextPage);
  }, [contacts, visibleContacts.length, contactsPage]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  }, [loadContacts]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

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
          name: contact.name ?? "Unknown",
          number: formattedPhoneNumber,
          recipientName: contact.name ?? "Unknown",
          recipientImage: contact.imageAvailable
            ? contact.image?.uri
            : undefined,
        },
      });
    },
    [router, params],
  );

  return (
    <ScreenView
      backgroundColor="$background"
      padding="$0"
      justifyContent="space-between"
    >
      <YStack flex={1} paddingHorizontal="$4" gap="$4" paddingTop="$8">
        <YStack gap="$2">
          <HeaderTitle>Select a Contact</HeaderTitle>
        </YStack>

        {isLoadingContacts ? (
          <YStack flex={1} gap="$4" paddingTop="$4">
            {Array.from({ length: 6 }).map((_, index) => (
              <UserCard.Skeleton key={index} width={getToken("$12", "size")} />
            ))}
          </YStack>
        ) : contacts.length === 0 ? (
          <EmptyPlaceholder
            icon={PhoneIcon}
            title="No Contacts Found"
            subtitle="We couldn't find any contacts that aren't already on the app. Try inviting some friends!"
          />
        ) : (
          <FlashList
            data={visibleContacts}
            // keyExtractor={(item) => item.id}
            estimatedItemSize={80}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            onEndReached={loadMoreContacts}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={() => {
              return (
                <>
                  {isLoadingContacts ? (
                    <YStack flex={1} gap="$4" paddingTop="$4">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <UserCard.Skeleton key={index} width={getToken("$12", "size")} />
                      ))}
                    </YStack>
                  ) : (
                    <EmptyPlaceholder
                      icon={PhoneIcon}
                      title="No Contacts Found"
                      subtitle="We couldn't find any contacts that aren't already on the app. Try inviting some friends!"
                    />
                  )}
                </>
              );
            }}
            ItemSeparatorComponent={() => <YStack height="$4" />}
            renderItem={({ item: contact, index }) => (
              <UserCard
                userId={contact.id ?? contact.name ?? Math.random().toString()}
                username={contact.name ?? "Unknown"}
                profilePictureUrl={
                  contact.imageAvailable && contact.image?.uri
                    ? contact.image.uri
                    : null
                }
                bio={contact.phoneNumbers?.[0]?.number ?? undefined}
                // size="large"
                // size="small"
                style="minimal"
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
        )}
      </YStack>
    </ScreenView>
  );
};

export default SelectContact;
