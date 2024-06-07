import { useState } from "react";
import * as FileSystem from "expo-file-system";
import * as Contacts from 'expo-contacts';
import * as Crypto from 'expo-crypto';
import { ChevronRight, XCircle, RefreshCcw, Trash } from "@tamagui/lucide-icons";
import { Button, YStack } from "tamagui";
import { parsePhoneNumber, type CountryCode } from 'libphonenumber-js'

import type { SettingsGroupInput } from "~/components/Settings";
import { renderSettingsGroup } from "~/components/Settings";
import type { ButtonOption } from "~/components/Sheets";
import { ActionSheet } from "~/components/Sheets";
import { BaseScreenView } from "~/components/Views";
import { useSession } from "~/contexts/SessionContext";

const Other = () => {
  const { deleteAccount } = useSession();

  const [isClearCacheModalVisible, setIsClearCacheModalVisible] =
    useState(false);
  const [isSyncContactsModalVisible, setIsSyncContactsModalVisible] =
    useState(false);
  const [isDeleteContactsModalVisible, setIsDeleteContactsModalVisible] =
    useState(false);
  const [isDeleteAccountModalVisible, setIsDeleteAccountModalVisible] =
    useState(false);

  const handleClearCache = async () => {
    if (FileSystem.cacheDirectory === null) return;
    await FileSystem.deleteAsync(FileSystem.cacheDirectory, {
      idempotent: true,
    });
  };

  const handleSyncContacts = async () => {
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });

    const phoneNumbers = data.reduce<{ country: string, number: string }[]>((acc, contact) => {
      if (contact.phoneNumbers) {
        for (let phoneNumber of contact.phoneNumbers) {
          if (!phoneNumber.countryCode || !phoneNumber.number) continue;

          acc.push({
            country: phoneNumber.countryCode,
            number: phoneNumber.number
          });
        }
      }
      return acc;
    }, []);

    let numbers = phoneNumbers.map(numberthing => {
      // try {
      const phoneNumber = parsePhoneNumber(numberthing.number, numberthing.country.toLocaleUpperCase() as CountryCode);
      return phoneNumber;
      /*       } catch (e) {
              console.log(e);
            } */
    });


    const array22 = new Uint8Array([1, 2, 3, 4, 5]);
    const hashed = await Crypto.digest(
      Crypto.CryptoDigestAlgorithm.SHA512,
      array22
    );

    console.log(hashed)
    /* 1 */

    /*         hashedNumbers.forEach(console.log);    const hashedNumbers = await Promise.all(numbers.map(async number => {
              return await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                number.number
              );
            }));
         */
    // hashedNumbers.forEach(console.log);

  };

  const handleDeleteContacts = async () => {
  };

  const clearCachetitle = "Clear Cache";
  const clearCacheSubtitle =
    "Clearing cache can help resolve issues with the app.";
  const clearCacheButtonOptions = [
    {
      text: "Clear Cache",
      textProps: {
        color: "$red9",
      },
      onPress: () => {
        void handleClearCache();
        setIsClearCacheModalVisible(false);
      },
    },
  ] satisfies ButtonOption[];

  const syncContactsTitle = "Sync Contacts";
  const syncContactsSubtitle =
    "Syncing contacts can help you find friends on OPPFY.";
  const syncContactsButtonOptions = [
    {
      text: "Sync Contacts",
      onPress: () => {
        void handleSyncContacts();
        setIsSyncContactsModalVisible(false);
      },
    },
  ] satisfies ButtonOption[];

  const deleteContactsTitle = "Delete Contacts";
  const deleteContactsSubtitle =
    "Are you sure you want to delete your synced contacts? This will negatively affect reccomendations.";
  const deleteContactsButtonOptions = [
    {
      text: "Delete Contacts",
      textProps: {
        color: "$red9",
      },
      onPress: () => {
        setIsDeleteContactsModalVisible(false);
      },
    },
  ] satisfies ButtonOption[];

  const deleteAccounttitle = "Delete Account";
  const deleteAccountSubtitle =
    "Are you sure you want to delete your account? This action cannot be undone.";
  const deleteAccountButtonOptions = [
    {
      text: "Delete Account",
      textProps: {
        color: "$red9",
      },
      onPress: () => {
        void deleteAccount();
        setIsDeleteAccountModalVisible(false);
      },
    },
  ] satisfies ButtonOption[];

  const settingsGroups = [
    {
      headerTitle: "Other",
      items: [
        {
          title: "Clear Cache",
          icon: <XCircle />,
          iconAfter: <ChevronRight />,
          onPress: () => setIsClearCacheModalVisible(true),
        },
      ],
    },
    {
      headerTitle: "Contacts",
      items: [
        {
          title: "Sync",
          icon: <RefreshCcw />,
          iconAfter: <ChevronRight />,
          onPress: () => setIsSyncContactsModalVisible(true),
        },
        {
          title: "Delete",
          icon: <Trash />,
          iconAfter: <ChevronRight />,
          onPress: () => setIsDeleteContactsModalVisible(true),
        }
      ],
    }
  ] satisfies SettingsGroupInput[];

  return (
    <BaseScreenView scrollable>
      <YStack gap="$4">
        {settingsGroups.map(renderSettingsGroup)}
        <Button
          size="$4.5"
          color="$red9"
          onPress={() => setIsDeleteAccountModalVisible(true)}
        >
          Delete Account
        </Button>
      </YStack>

      <ActionSheet
        title={clearCachetitle}
        subtitle={clearCacheSubtitle}
        buttonOptions={clearCacheButtonOptions}
        isVisible={isClearCacheModalVisible}
        onCancel={() => setIsClearCacheModalVisible(false)}
      />

      <ActionSheet
        title={syncContactsTitle}
        subtitle={syncContactsSubtitle}
        buttonOptions={syncContactsButtonOptions}
        isVisible={isSyncContactsModalVisible}
        onCancel={() => setIsSyncContactsModalVisible(false)}
      />
      <ActionSheet
        title={deleteContactsTitle}
        subtitle={deleteContactsSubtitle}
        buttonOptions={deleteContactsButtonOptions}
        isVisible={isDeleteContactsModalVisible}
        onCancel={() => setIsDeleteContactsModalVisible(false)}
      />

      <ActionSheet
        title={deleteAccounttitle}
        subtitle={deleteAccountSubtitle}
        buttonOptions={deleteAccountButtonOptions}
        isVisible={isDeleteAccountModalVisible}
        onCancel={() => setIsDeleteAccountModalVisible(false)}
      />
    </BaseScreenView>
  );
};

export default Other;
