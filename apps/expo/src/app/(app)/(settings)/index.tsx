import { useState } from "react";
import { useRouter } from "expo-router";
import {
  BellRing,
  ChevronRight,
  Hammer,
  Info,
  LifeBuoy,
  Share2,
  ShieldCheck,
  Star,
} from "@tamagui/lucide-icons";
import { Button, YStack } from "tamagui";

import type { SettingsGroup } from "~/components/Settings";
import { renderSettingsGroup } from "~/components/Settings";
import type { ButtonOption } from "~/components/Sheets";
import { ActionSheet } from "~/components/Sheets";
import { ScreenBaseView } from "~/components/Views";
import { useSession } from "~/contexts/SessionContext";

const Settings = () => {
  const { signOut } = useSession();
  const router = useRouter();

  const [isModalVisible, setIsModalVisible] = useState(false);

  // TODO: Implement
  const onShare = async () => {};

  // TODO: Implement
  const onRate = async () => {};

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
      headerTitle: "Settings",
      items: [
        {
          title: "Notifications",
          icon: <BellRing />,
          iconAfter: <ChevronRight />,
          onPress: () => router.push("/notifications"),
        },
        {
          title: "Privacy",
          icon: <ShieldCheck />,
          iconAfter: <ChevronRight />,
          onPress: () => router.push("/privacy"),
        },
        {
          title: "Other",
          icon: <Hammer />,
          iconAfter: <ChevronRight />,
          onPress: () => router.push("/other"),
        },
      ],
    },
    {
      headerTitle: "Other",
      items: [
        {
          title: "Share Us",
          icon: <Share2 />,
          iconAfter: <ChevronRight />,
          onPress: void onShare,
        },
        {
          title: "Rate Us",
          icon: <Star />,
          iconAfter: <ChevronRight />,
          onPress: void onRate,
        },
        {
          title: "Help",
          icon: <LifeBuoy />,
          iconAfter: <ChevronRight />,
          onPress: () => router.push("/help"),
        },
        {
          title: "About",
          icon: <Info />,
          iconAfter: <ChevronRight />,
          onPress: () => router.push("/about"),
        },
      ],
    },
  ] satisfies SettingsGroup[];

  return (
    <ScreenBaseView scrollable>
      <YStack gap="$4">
        {settingsGroups.map(renderSettingsGroup)}
        <Button
          size="$4.5"
          color="$red9"
          onPress={() => setIsModalVisible(true)}
        >
          Logout
        </Button>
      </YStack>

      <ActionSheet
        title={title}
        subtitle={subtitle}
        buttonOptions={buttonOptions}
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </ScreenBaseView>
  );
};

export default Settings;
