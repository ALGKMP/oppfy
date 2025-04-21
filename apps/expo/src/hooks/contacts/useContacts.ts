import { useCallback } from "react";
import * as Contacts from "expo-contacts";
import type { Contact, PhoneNumber } from "expo-contacts";
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
  parsePhoneNumberEntry: (
    phoneNumber: PhoneNumber | undefined,
  ) => string | null;
}

const useContacts = (): ContactFns => {
  // const deleteContactsMutation = api.contacts.deleteContacts.useMutation();
  const updateContactsMutation = api.contacts.updateUserContacts.useMutation();
  const filterContactsOnApp =
    api.contacts.getUnregisteredPhoneNumbers.useMutation();

  const parsePhoneNumberEntry = (
    phoneNumber: PhoneNumber | undefined,
  ): string | null => {
    if (!phoneNumber) return null;

    const { number, countryCode } = phoneNumber;
    if (!number || !countryCode) return null;

    try {
      const parsed = parsePhoneNumberWithError(
        number,
        countryCode.toUpperCase() as CountryCode,
      );
      return parsed.isValid() ? parsed.format("E.164") : null;
    } catch {
      return null;
    }
  };

  const getFirstValidE164Number = (contact: Contact): string | null => {
    const firstPhoneNumber = contact.phoneNumbers?.[0];
    return firstPhoneNumber ? parsePhoneNumberEntry(firstPhoneNumber) : null;
  };

  const getContactE164Numbers = (contact: Contact): string[] => {
    return (contact.phoneNumbers ?? [])
      .map((pn) => parsePhoneNumberEntry(pn))
      .filter((num): num is string => num !== null);
  };

  const contactsToE164Numbers = (contacts: Contact[]) => {
    return contacts
      .map(getFirstValidE164Number)
      .filter((num): num is string => num !== null);
  };

  const contactsNotOnApp = (contacts: Contact[], numbers: string[]) => {
    return contacts.filter((contact) => {
      const e164 = getFirstValidE164Number(contact);
      return e164 !== null && numbers.includes(e164);
    });
  };

  const syncContacts = useCallback(async () => {
    const { status } = await Contacts.getPermissionsAsync();
    if (status !== PermissionStatus.GRANTED) return;

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });

    const numbers = data.flatMap(getContactE164Numbers);

    const hashedNumbers = await Promise.all(
      numbers.map(async (number) => {
        return await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA512,
          number,
        );
      }),
    );

    void updateContactsMutation.mutateAsync({
      hashedPhoneNumbers: hashedNumbers,
    });
  }, [getContactE164Numbers, updateContactsMutation]);

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

    const sortedContacts = contacts.sort((a, b) => {
      const aScore = getContactScore(a);
      const bScore = getContactScore(b);
      return bScore - aScore;
    });

    return sortedContacts;
  };

  const getDeviceContactsNotOnAppPaginated = async (
    pageOffset = 0,
    pageSize = PAGE_SIZE,
  ) => {
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
    const hasMore = pageOffset + pageSize < totalContacts;

    return { contacts, hasMore, totalContacts };
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
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  });

  const getContactScore = (contact: Contact): number => {
    let score = 0;
    if (contact.imageAvailable) score += 4;
    if (contact.addresses?.length) score += 3;
    if (contact.birthday) score += 2;
    return score;
  };

  const getRecomendedContacts = async () => {
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

    const imageContacts = data.filter((contact) => contact.imageAvailable);
    const addressContacts = data.filter((contact) => contact.addresses?.length);
    const birthdayContacts = data.filter((contact) => contact.birthday);
    const noteContacts = data.filter((contact) => contact.note);

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

  return {
    syncContacts,
    contactsPaginatedQuery,
    deleteContacts: () =>
      updateContactsMutation.mutateAsync({ hashedPhoneNumbers: [] }),
    getDeviceContacts,
    searchContacts,
    getRecomendedContacts,
    getDeviceContactsNotOnApp,
    getDeviceContactsNotOnAppPaginated,
    parsePhoneNumberEntry,
  };
};

export default useContacts;
