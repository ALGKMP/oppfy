import { useState } from "react";
import * as FileSystem from "expo-file-system";
import {
  ChevronRight,
  RefreshCcw,
  Trash,
  XCircle,
} from "@tamagui/lucide-icons";
import { Button, YStack } from "tamagui";

import {
  renderSettingsList,
  ScreenView,
  SettingsListInput,
  useActionSheetController,
} from "~/components/ui";
import { useSession } from "~/contexts/SessionContext";
import { useContacts } from "~/hooks/contacts";

const Other = () => {
  const { deleteAccount } = useSession();
  const {
    syncContacts: handleSyncContacts,
    deleteContacts: handleDeleteContacts,
  } = useContacts();
  const actionSheet = useActionSheetController();

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
          onPress: () => void handleSyncContacts(),
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

  const settingsGroups = [
    {
      headerTitle: "Other",
      items: [
        {
          title: "Clear Cache",
          icon: <XCircle />,
          iconAfter: <ChevronRight />,
          onPress: handleShowClearCache,
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
          onPress: handleShowSyncContacts,
        },
        {
          title: "Delete",
          icon: <Trash />,
          iconAfter: <ChevronRight />,
          onPress: handleShowDeleteContacts,
        },
      ],
    },
  ] satisfies SettingsListInput[];

  return (
    <ScreenView scrollable>
      <YStack gap="$4">
        {settingsGroups.map(renderSettingsList)}
        <Button size="$4.5" color="$red9" onPress={handleShowDeleteAccount}>
          Delete Account
        </Button>
      </YStack>
    </ScreenView>
  );
};

export default Other;
