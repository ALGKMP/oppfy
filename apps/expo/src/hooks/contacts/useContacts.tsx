import { useEffect } from "react";
import * as Contacts from "expo-contacts";
import * as Crypto from "expo-crypto";
import { parsePhoneNumber } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

import { api } from "~/utils/api";

export interface ContactFns {
  syncContacts: () => void;
  deleteContacts: () => void;
}

const useContacts = (syncNow: boolean): ContactFns => {
  const deleteContactsMutation = api.contacts.deleteContacts.useMutation();
  const syncContactsMutation = api.contacts.syncContacts.useMutation();

  const syncContacts = async () => {
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

  if (syncNow) {
    useEffect(() => {
      void syncContacts();
    });
  }

  return {
    syncContacts,
    deleteContacts: deleteContactsMutation.mutateAsync,
  };
};

export default useContacts;
