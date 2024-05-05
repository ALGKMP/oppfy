import { useState } from "react";
import {
  BellRing,
  ChevronRight,
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

  const [isModalVisible, setIsModalVisible] = useState(false);

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
      title: "Settings",
      items: [
        {
          title: "Notifications",
          icon: <BellRing />,
          iconAfter: <ChevronRight />,
        },
        {
          title: "Privacy",
          icon: <ShieldCheck />,
          iconAfter: <ChevronRight />,
        },
        { title: "Other", icon: <ShieldCheck />, iconAfter: <ChevronRight /> },
      ],
    },
    {
      title: "Other",
      items: [
        { title: "Share Us", icon: <Share2 />, iconAfter: <ChevronRight /> },
        { title: "Rate Us", icon: <Star />, iconAfter: <ChevronRight /> },
        { title: "Help", icon: <LifeBuoy />, iconAfter: <ChevronRight /> },
        { title: "About", icon: <Info />, iconAfter: <ChevronRight /> },
      ],
    },
  ] satisfies SettingsGroup[];

  return (
    <ScreenBaseView>
      <YStack gap="$4">
        {settingsGroups.map(renderSettingsGroup)}
        <Button color="$red9" onPress={() => setIsModalVisible(true)}>
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
