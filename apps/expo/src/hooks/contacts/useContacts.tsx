import { useCallback, useEffect } from "react";
import * as Contacts from "expo-contacts";
import type { Contact } from "expo-contacts";
import { PermissionStatus } from "expo-contacts";
import * as Crypto from "expo-crypto";
import { parsePhoneNumber, parsePhoneNumberWithError } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

import { api } from "~/utils/api";

export interface ContactFns {
  syncContacts: () => Promise<void>;
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

    const numbers = phoneNumbers.map((numberthing) => {
      const phoneNumber = parsePhoneNumberWithError(
        numberthing.number,
        numberthing.country.toLocaleUpperCase() as CountryCode,
      );
      return phoneNumber.formatInternational().replaceAll(" ", "");
    });

    const hashedNumbers = await Promise.all(
      numbers.map(async (number) => {
        return await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA512,
          number,
        );
      }),
    );

    console.log("syncing contacts", hashedNumbers);

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
          const parsedNumber = parsePhoneNumber(number);
          return parsedNumber.isValid() ? parsedNumber.format("E.164") : null;
        } catch (error) {
          return null;
        }
      })
      .filter((number): number is string => number !== null);

    const phoneNumbersNotOnApp = await filterContactsOnApp.mutateAsync({
      phoneNumbers,
    });

    const contactsNotOnApp = phoneNumbersNotOnApp
      .map((phoneNumber) => {
        return data.find((contact) => {
          const number = contact.phoneNumbers?.[0]?.number;

          if (number === undefined) return false;

          try {
            const parsedNumber = parsePhoneNumber(number);
            return (
              parsedNumber.isValid() &&
              parsedNumber.format("E.164") === phoneNumber
            );
          } catch (error) {
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
    deleteContacts: deleteContactsMutation.mutateAsync,
    getDeviceContacts,
    getRecomendedContacts,
    getDeviceContactsNotOnApp,
  };
};

export default useContacts;
