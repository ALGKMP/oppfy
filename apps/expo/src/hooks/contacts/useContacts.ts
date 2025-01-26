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
  getDeviceContactsNotOnApp: () => Promise<Contacts.Contact[]>;
}

const useContacts = (syncNow = false): ContactFns => {
  const deleteContactsMutation = api.contacts.deleteContacts.useMutation();
  const syncContactsMutation = api.contacts.syncContacts.useMutation();
  const filterContactsOnApp =
    api.contacts.filterOutPhoneNumbersOnApp.useMutation();

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

    const phoneNumbers = data
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

    const phoneNumbersNotOnApp = await filterContactsOnApp.mutateAsync({
      phoneNumbers,
    });

    const contactsNotOnApp = phoneNumbersNotOnApp
      .map((phoneNumber) => {
        return data.find((contact) => {
          const number = contact.phoneNumbers?.[0]?.number;

          if (number === undefined) return false;

          try {
            const parsedNumber = parsePhoneNumberWithError(number);
            return (
              parsedNumber.isValid() &&
              parsedNumber.format("E.164") === phoneNumber
            );
          } catch {
            return false;
          }
        });
      })
      .filter((contact): contact is Contact => contact !== undefined);

    // Sort contacts based on criteria
    const sortedContacts = contactsNotOnApp.sort((a, b) => {
      const aScore = getContactScore(a);
      const bScore = getContactScore(b);
      return bScore - aScore; // Higher score first
    });

    return sortedContacts;
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
      const contacts = await getDeviceContactsNotOnApp();

      const startIndex = context.pageParam ?? 0;
      const pageSize = isInitialFetch ? INITIAL_PAGE_SIZE : PAGE_SIZE;
      const endIndex = startIndex + pageSize;

      const items = contacts.slice(startIndex, endIndex);
      const hasNextPage = endIndex < contacts.length;

      return {
        items,
        nextCursor: hasNextPage ? endIndex : null,
        hasNextPage,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
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
    getRecomendedContacts,
    getDeviceContactsNotOnApp,
  };
};

export default useContacts;
