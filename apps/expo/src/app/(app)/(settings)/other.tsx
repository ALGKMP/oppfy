import { useState } from "react";
import * as FileSystem from "expo-file-system";
import {
  ChevronRight,
  RefreshCcw,
  Trash,
  XCircle,
} from "@tamagui/lucide-icons";
import { Button, YStack } from "tamagui";

import type { SettingsGroupInput } from "~/components/Settings";
import { renderSettingsGroup } from "~/components/Settings";
import type { ButtonOption } from "~/components/Sheets";
import { ActionSheet } from "~/components/Sheets";
import { BaseScreenView } from "~/components/Views";
import { useSession } from "~/contexts/SessionContext";
import { useContacts } from "~/hooks/contacts";

const Other = () => {
  const { deleteAccount } = useSession();
  const {
    syncContacts: handleSyncContacts,
    deleteContacts: handleDeleteContacts,
  } = useContacts();

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

    try {
      await FileSystem.deleteAsync(FileSystem.cacheDirectory, {
        idempotent: true,
      });
    } catch {
      /* empty */
    }
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
        void handleDeleteContacts();
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
        },
      ],
    },
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
