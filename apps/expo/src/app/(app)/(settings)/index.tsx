import { useState } from "react";
import { Share } from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as StoreReview from "expo-store-review";
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
import { reportRouter } from "node_modules/@oppfy/api/src/routers";
import { Button, YStack } from "tamagui";

import type { SettingsGroupInput } from "~/components/Settings";
import { renderSettingsGroup } from "~/components/Settings";
import type { ButtonOption } from "~/components/Sheets";
import { ActionSheet } from "~/components/Sheets";
import { BaseScreenView } from "~/components/Views";
import { useSession } from "~/contexts/SessionContext";

enum WEBSITE_URL {
  HELP = "https://oppfy/help.com",
  ABOUT = "https://oppfy/about.com",
}

const Settings = () => {
  const { signOut } = useSession();
  const router = useRouter();

  const [isModalVisible, setIsModalVisible] = useState(false);

  // TODO: Update details
  const handleShare = async () => {
    await Share.share({
      title: "Share Oppfy",
      message: "Check out Oppfy, it's a great app!",
      url: "https://oppfy.com",
    });
  };

  const handleRate = async () => {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }
  };

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
          onPress: () => void handleShare(),
        },
        {
          title: "Rate Us",
          icon: <Star />,
          iconAfter: <ChevronRight />,
          onPress: () => void handleRate(),
        },
        {
          title: "Help",
          icon: <LifeBuoy />,
          iconAfter: <ChevronRight />,
          onPress: () => void Linking.openURL(WEBSITE_URL.HELP),
        },
        {
          title: "About",
          icon: <Info />,
          iconAfter: <ChevronRight />,
          onPress: () => void Linking.openURL(WEBSITE_URL.ABOUT),
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
          onPress={() => setIsModalVisible(true)}
        >
          Logout
        </Button>
        <Button
          size="$4.5"
          color="$yellow10Dark"
          onPress={() => router.push("/_sitemap")}
        >
          Sitemap
        </Button>
      </YStack>

      <ActionSheet
        title={title}
        subtitle={subtitle}
        buttonOptions={buttonOptions}
        isVisible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
      />
    </BaseScreenView>
  );
};

export default Settings;
