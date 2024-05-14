import { useState } from "react";
import * as FileSystem from "expo-file-system";
import { ChevronRight, XCircle } from "@tamagui/lucide-icons";
import { Button, YStack } from "tamagui";

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
  const [isDeleteAccountModalVisible, setIsDeleteAccountModalVisible] =
    useState(false);

  const handleClearCache = async () => {
    if (FileSystem.cacheDirectory === null) return;
    await FileSystem.deleteAsync(FileSystem.cacheDirectory, {
      idempotent: true,
    });
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
  ] satisfies SettingsGroupInput[];

  return (
    <BaseScreenView>
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
        onClose={() => setIsClearCacheModalVisible(false)}
      />
      <ActionSheet
        title={deleteAccounttitle}
        subtitle={deleteAccountSubtitle}
        buttonOptions={deleteAccountButtonOptions}
        isVisible={isDeleteAccountModalVisible}
        onClose={() => setIsDeleteAccountModalVisible(false)}
      />
    </BaseScreenView>
  );
};

export default Other;
