import { useState } from "react";
import { useRouter } from "expo-router";
import {
  BellRing,
  ChevronRight,
  Info,
  LifeBuoy,
  MessageCircle,
  Share2,
  ShieldCheck,
  Star,
  StickyNote,
  UsersRound,
} from "@tamagui/lucide-icons";
import { Button, YStack } from "tamagui";

import type { SettingsGroup } from "~/components/Settings";
import { renderSettingsGroup } from "~/components/Settings";
import type { ButtonOption } from "~/components/Sheets";
import { ActionSheet } from "~/components/Sheets";
import { ScreenBaseView } from "~/components/Views";
import { useSession } from "~/contexts/SessionContext";

const Notifications = () => {
  const { signOut } = useSession();
  const router = useRouter();

  const title = "Log Out";
  const subtitle = "Are you sure you want to log out?";
  const buttonOptions = [
    {
      text: "Log Out",
      textProps: {
        color: "$red9",
      },
      onPress: () => void signOut(),
    },
  ] satisfies ButtonOption[];

  const settingsGroups = [
    {
      headerTitle: "Notifications",
      items: [
        {
          title: "Friends Posts",
          icon: <StickyNote />,
          iconAfter: <ChevronRight />,
          onPress: () => router.push("/notifications"),
        },
        {
          title: "Comments",
          icon: <MessageCircle />,
          iconAfter: <ChevronRight />,
          onPress: () => router.push("/privacy"),
        },
        {
          title: "Friend Requests",
          icon: <UsersRound />,
          iconAfter: <ChevronRight />,
          onPress: () => router.push("/other"),
        },
      ],
    },
  ] satisfies SettingsGroup[];

  const onSubmit = () => {
    console.log("onSubmit");
  };

  return (
    <ScreenBaseView scrollable>
      <YStack gap="$4">
        {settingsGroups.map(renderSettingsGroup)}
        <Button size="$5" onPress={onSubmit}>
          Save
        </Button>
      </YStack>
    </ScreenBaseView>
  );
};

export default Notifications;
