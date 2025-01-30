import { useState } from "react";
import * as FileSystem from "expo-file-system";
import {
  ChevronRight,
  RefreshCcw,
  Trash,
  XCircle,
} from "@tamagui/lucide-icons";

import {
  Button,
  ScreenView,
  SettingsGroup,
  useActionSheetController,
  YStack,
} from "~/components/ui";
import { useContacts } from "~/hooks/contacts";
import { useAuth } from "~/hooks/useAuth";
import { api } from "~/utils/api";

const Other = () => {
  const { deleteAccount } = useAuth();
  const {
    syncContacts: handleSyncContacts,
    deleteContacts: handleDeleteContacts,
    getDeviceContactsNotOnApp
  } = useContacts();

  const actionSheet = useActionSheetController();
  const utils = api.useUtils();

  const handleClearCache = () => {
    if (FileSystem.cacheDirectory === null) return;
    void FileSystem.deleteAsync(FileSystem.cacheDirectory, {
      idempotent: true,
    });
  };

  const handleShowClearCache = () => {
    actionSheet.show({
      title: "Clear Cache",
      subtitle: "Clearing cache can help resolve issues with the app.",
      buttonOptions: [
        {
          text: "Clear Cache",
          textProps: {
            color: "$red9",
          },
          onPress: handleClearCache,
        },
      ],
    });
  };

  const handleShowSyncContacts = () => {
    actionSheet.show({
      title: "Sync Contacts",
      subtitle: "Syncing contacts can help you find friends on OPPFY.",
      buttonOptions: [
        {
          text: "Sync Contacts",
          onPress: () => {
            void handleSyncContacts();
            // invalidate query
            utils.contacts.getRecommendationProfilesSelf.invalidate();
          },
        },
      ],
    });
  };

  const handleShowDeleteContacts = () => {
    actionSheet.show({
      title: "Delete Contacts",
      subtitle:
        "Are you sure you want to delete your synced contacts? This will negatively affect recommendations.",
      buttonOptions: [
        {
          text: "Delete Contacts",
          textProps: {
            color: "$red9",
          },
          onPress: () => void handleDeleteContacts(),
        },
      ],
    });
  };

  const handleShowDeleteAccount = () => {
    actionSheet.show({
      title: "Delete Account",
      subtitle:
        "Are you sure you want to delete your account? This action cannot be undone.",
      buttonOptions: [
        {
          text: "Delete Account",
          textProps: {
            color: "$red9",
          },
          onPress: () => void deleteAccount(),
        },
      ],
    });
  };

  return (
    <ScreenView scrollable>
      <YStack gap="$4">
        <SettingsGroup title="Other">
          <SettingsGroup.Item
            title="Clear Cache"
            icon={<XCircle />}
            iconAfter={<ChevronRight />}
            onPress={handleShowClearCache}
          />
        </SettingsGroup>

        <SettingsGroup title="Contacts">
          <SettingsGroup.Item
            title="Sync"
            icon={<RefreshCcw />}
            iconAfter={<ChevronRight />}
            onPress={handleShowSyncContacts}
          />
          <SettingsGroup.Item
            title="Delete"
            icon={<Trash />}
            iconAfter={<ChevronRight />}
            onPress={handleShowDeleteContacts}
          />
          <SettingsGroup.Item
            title="Test button"
            onPress={async () => {
              await getDeviceContactsNotOnApp();
            }}
          ></SettingsGroup.Item>
        </SettingsGroup>

        <Button variant="danger" onPress={handleShowDeleteAccount}>
          Delete Account
        </Button>
      </YStack>
    </ScreenView>
  );
};

export default Other;
