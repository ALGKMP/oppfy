import { useState } from "react";
import * as FileSystem from "expo-file-system";
import { ChevronRight, UserRoundX, XCircle } from "@tamagui/lucide-icons";
import { Avatar, Button, YStack } from "tamagui";

import type { SettingsGroup, SettingsItem } from "~/components/Settings";
import { renderSettingsGroup } from "~/components/Settings";
import type { ButtonOption } from "~/components/Sheets";
import { ActionSheet } from "~/components/Sheets";
import { ScreenBaseView } from "~/components/Views";
import { useSession } from "~/contexts/SessionContext";

const test = {
  title: "Christina",
  subtitle: "christinaikl",
  icon: (
    <Avatar circular size="$5">
      <Avatar.Image
        accessibilityLabel="Cam"
        src="https://images.unsplash.com/photo-1548142813-c348350df52b?&w=150&h=150&dpr=2&q=80"
      />
      <Avatar.Fallback backgroundColor="$blue10" />
    </Avatar>
  ),
  iconAfter: (
    <Button icon={<UserRoundX size="$1" />} size="$4">
      Unblock
    </Button>
  ),
  pressTheme: false,
  hoverTheme: false,
} satisfies SettingsItem;

const BlockedUsers = () => {
  const { deleteAccount } = useSession();

  const settingsGroups = [
    {
      headerTitle: "Blocked Users (6)",
      items: [test, test, test, test, test, test],
    },
  ] satisfies SettingsGroup[];

  return (
    <ScreenBaseView scrollable>
      <YStack gap="$4">{settingsGroups.map(renderSettingsGroup)}</YStack>
    </ScreenBaseView>
  );
};

export default BlockedUsers;
