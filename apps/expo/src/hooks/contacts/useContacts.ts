import { useCallback, useEffect } from "react";
import * as Contacts from "expo-contacts";
import type { Contact } from "expo-contacts";
import { PermissionStatus } from "expo-contacts";
import * as Crypto from "expo-crypto";
import { useInfiniteQuery } from "@tanstack/react-query";
import type {
  InfiniteData,
  QueryFunctionContext,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { parsePhoneNumberWithError } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

import { api } from "~/utils/api";

const INITIAL_PAGE_SIZE = 20;
const PAGE_SIZE = 10;

interface ContactsPage {
  items: Contact[];
  nextCursor: number | null;
  hasNextPage: boolean;
}

type ContactsQueryKey = ["contacts"];
type ContactsInfiniteData = InfiniteData<ContactsPage>;

export interface ContactFns {
  syncContacts: () => Promise<void>;
  contactsPaginatedQuery: UseInfiniteQueryResult<ContactsInfiniteData, Error>;
  deleteContacts: () => Promise<void>;
  getDeviceContacts: () => Promise<Contacts.Contact[]>;
  getRecomendedContacts: () => Promise<Contacts.Contact[]>;
  getDeviceContactsNotOnAppPaginated: (
    pageOffset?: number,
    pageSize?: number,
  ) => Promise<{
    contacts: Contacts.Contact[];
    hasMore: boolean;
    totalContacts: number;
  }>;
  getDeviceContactsNotOnApp: () => Promise<Contacts.Contact[]>;
  searchContacts: (name: string) => Promise<Contacts.Contact[]>;
}

const useContacts = (syncNow = false): ContactFns => {
  const deleteContactsMutation = api.contacts.deleteContacts.useMutation();
  const syncContactsMutation = api.contacts.syncContacts.useMutation();
  const filterContactsOnApp =
    api.contacts.filterOutPhoneNumbersOnApp.useMutation();

  const contactsToE164Numbers = (contacts: Contacts.Contact[]) => {
    return contacts
      .map((contact) => {
        const number = contact.phoneNumbers?.[0]?.number;
        if (number === undefined) return null;
        try {
          const parsedNumber = parsePhoneNumberWithError(number);
          return parsedNumber.isValid() ? parsedNumber.format("E.164") : null;
        } catch {
          return null;
        }
      })
      .filter((number) => number !== null);
  };

  const contactsNotOnApp = (
    contacts: Contacts.Contact[],
    numbers: string[],
  ) => {
    return contacts.filter((contact) => {
      const number = contact.phoneNumbers?.[0]?.number;
      if (number === undefined) return false;
      try {
        const parsedNumber = parsePhoneNumberWithError(number);
        return (
          parsedNumber.isValid() &&
          numbers.includes(parsedNumber.format("E.164"))
        );
      } catch {
        return false;
      }
    });
  };

  const syncContacts = useCallback(async () => {
    // make sure its allowed
    const { status } = await Contacts.getPermissionsAsync();
    if (status !== PermissionStatus.GRANTED) {
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });

    const phoneNumbers = data.reduce<{ country: string; number: string }[]>(
      (acc, contact) => {
        if (contact.phoneNumbers) {
          for (const phoneNumber of contact.phoneNumbers) {
            if (!phoneNumber.countryCode || !phoneNumber.number) continue;

            acc.push({
              country: phoneNumber.countryCode,
              number: phoneNumber.number,
            });
          }
        }
        return acc;
      },
      [],
    );

    const numbers = phoneNumbers.reduce<string[]>((acc, numberthing) => {
      try {
        const phoneNumber = parsePhoneNumberWithError(
          numberthing.number,
          numberthing.country.toLocaleUpperCase() as CountryCode,
        );
        acc.push(phoneNumber.formatInternational().replaceAll(" ", ""));
      } catch {
        // Skip invalid phone numbers
      }
      return acc;
    }, []);

    const hashedNumbers = await Promise.all(
      numbers.map(async (number) => {
        return await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA512,
          number,
        );
      }),
    );

    void syncContactsMutation.mutateAsync(hashedNumbers);
  }, [syncContactsMutation]);

  const getDeviceContacts = async () => {
    const { data } = await Contacts.getContactsAsync();

    return data;
  };

  const getDeviceContactsNotOnApp = async () => {
    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Image,
        Contacts.Fields.Name,
        Contacts.Fields.Birthday,
        Contacts.Fields.Addresses,
      ],
    });

    const phoneNumbers = contactsToE164Numbers(data);

    const phoneNumbersNotOnApp = await filterContactsOnApp.mutateAsync({
      phoneNumbers,
    });

    const contacts = contactsNotOnApp(data, phoneNumbersNotOnApp);

    // Sort contacts based on criteria
    const sortedContacts = contacts.sort((a, b) => {
      const aScore = getContactScore(a);
      const bScore = getContactScore(b);
      return bScore - aScore; // Higher score first
    });

    return sortedContacts;
  };

  const getDeviceContactsNotOnAppPaginated = async (
    pageOffset?: number,
    pageSize?: number,
  ) => {
    // First, get total number of contacts to help with pagination
    const { data: allContacts } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });
    const totalContacts = allContacts.length;

    const { data } = await Contacts.getPagedContactsAsync({
      fields: [
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Image,
        Contacts.Fields.Name,
        Contacts.Fields.Birthday,
        Contacts.Fields.Addresses,
      ],
      sort: "firstName",
      pageOffset,
      pageSize,
    });

    const phoneNumbers = contactsToE164Numbers(data);

    const phoneNumbersNotOnApp = await filterContactsOnApp.mutateAsync({
      phoneNumbers,
    });

    const contacts = contactsNotOnApp(data, phoneNumbersNotOnApp);

    /*     // Sort contacts based on criteria
    const sortedContacts = contacts.sort((a, b) => {
      const aScore = getContactScore(a);
      const bScore = getContactScore(b);
      return bScore - aScore; // Higher score first
    }); */

    // Calculate if there are more contacts to load
    const currentOffset = pageOffset ?? 0;
    const hasMore = currentOffset + (pageSize ?? 0) < totalContacts;

    return {
      contacts,
      hasMore,
      totalContacts,
    };
  };

  const contactsPaginatedQuery = useInfiniteQuery<
    ContactsPage,
    Error,
    ContactsInfiniteData,
    ContactsQueryKey,
    number | null
  >({
    queryKey: ["contacts"],
    queryFn: async (
      context: QueryFunctionContext<ContactsQueryKey, number | null>,
    ) => {
      const isInitialFetch = !context.pageParam;
      const pageSize = isInitialFetch ? INITIAL_PAGE_SIZE : PAGE_SIZE;
      const pageOffset = context.pageParam ?? 0;

      const result = await getDeviceContactsNotOnAppPaginated(
        pageOffset,
        pageSize,
      );

      return {
        items: result.contacts,
        nextCursor: result.hasMore ? pageOffset + pageSize : null,
        hasNextPage: result.hasMore,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor;
    },
    initialPageParam: null,
  });

  // Helper function to calculate contact score
  const getContactScore = (contact: Contact): number => {
    let score = 0;
    if (contact.imageAvailable) score += 4; // Highest priority
    if (contact.addresses?.length) score += 3;
    if (contact.birthday) score += 2;
    return score;
  };

  const getRecomendedContacts = async () => {
    // get contacts with profile pictures
    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Image,
        Contacts.Fields.Name,
        Contacts.Fields.Birthday,
        Contacts.Fields.Addresses,
        Contacts.Fields.Note,
      ],
    });

    // filter data for ones that actually have an image
    const imageContacts = data.filter((contact) => contact.imageAvailable);
    const addressContacts = data.filter((contact) => contact.addresses?.length);
    const birthdayContacts = data.filter((contact) => contact.birthday);
    const noteContacts = data.filter((contact) => contact.note);

    // get the phone numbers
    // tier 1: people with images
    // tier2: people with address, people with notes, people with birthdays
    // everyone else

    // put those ones

    const goodOnes = [
      ...imageContacts,
      ...addressContacts,
      ...birthdayContacts,
      ...noteContacts,
    ];

    return [
      ...goodOnes,
      ...data.filter((contact) => !goodOnes.includes(contact)),
    ];
  };

  const searchContacts = async (name: string) => {
    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Image,
        Contacts.Fields.Name,
      ],
      name,
    });

    const phoneNumbers = contactsToE164Numbers(data);

    const phoneNumbersNotOnApp = await filterContactsOnApp.mutateAsync({
      phoneNumbers,
    });

    return contactsNotOnApp(data, phoneNumbersNotOnApp);
  };

  useEffect(() => {
    if (syncNow) {
      void syncContacts();
    }
  }, [syncContacts, syncNow]);

  return {
    syncContacts,
    contactsPaginatedQuery,
    deleteContacts: deleteContactsMutation.mutateAsync,
    getDeviceContacts,
    searchContacts,
    getRecomendedContacts,
    getDeviceContactsNotOnApp,
    getDeviceContactsNotOnAppPaginated,
  };
};

export default useContacts;
