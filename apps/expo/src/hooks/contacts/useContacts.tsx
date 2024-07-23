import { useEffect } from "react";
import * as Contacts from "expo-contacts";
import * as Crypto from "expo-crypto";
import { parsePhoneNumber } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

import { api } from "~/utils/api";

export interface ContactFns {
  syncContacts: () => void;
  deleteContacts: () => void;
  getDeviceContacts: () => Promise<Contacts.Contact[]>;
  getRecomendedContacts: () => void;
}

const useContacts = (syncNow = false): ContactFns => {
  const deleteContactsMutation = api.contacts.deleteContacts.useMutation();
  const syncContactsMutation = api.contacts.syncContacts.useMutation();

  const syncContacts = async () => {
    // make sure its allowed
    const { status } = await Contacts.getPermissionsAsync();
    if (status !== "granted") {
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
      const phoneNumber = parsePhoneNumber(
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

    void syncContactsMutation.mutateAsync(hashedNumbers);
  };

  const getDeviceContacts = async () => {
    const { data } = await Contacts.getContactsAsync();

    return data;
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

  if (syncNow) {
    useEffect(() => {
      void syncContacts();
    }, []);
  }

  return {
    syncContacts,
    deleteContacts: deleteContactsMutation.mutateAsync,
    getDeviceContacts,
    getRecomendedContacts,
  };
};

export default useContacts;
