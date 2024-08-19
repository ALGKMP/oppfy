import { useState } from "react";
import { Share } from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as StoreReview from "expo-store-review";
import {
  BellRing,
  ChevronRight,
  FileLock2,
  Hammer,
  NotepadText,
  Share2,
  ShieldCheck,
  Star,
} from "@tamagui/lucide-icons";
import { Button, YStack } from "tamagui";

import type { SettingsGroupInput } from "~/components/Settings";
import { renderSettingsGroup } from "~/components/Settings";
import type { ButtonOption } from "~/components/Sheets";
import { ActionSheet } from "~/components/Sheets";
import { BaseScreenView } from "~/components/Views";
import { useSession } from "~/contexts/SessionContext";

enum WEBSITE_URL {
  PRIVACY = "https://oppfy.app/privacy",
  TERMS = "https://oppfy.app/terms",
}

const Settings = () => {
  const router = useRouter();
  const { signOut } = useSession();

  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleShare = async () => {
    await Share.share({
      title: "Join me on Oppfy!",
      message:
        "Check out Oppfy - the social media app where your friends capture your best moments! Download now:",
      url: "https://oppfy.app",
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
          title: "Privacy Policy",
          icon: <FileLock2 />,
          iconAfter: <ChevronRight />,
          onPress: () => void Linking.openURL(WEBSITE_URL.PRIVACY),
        },
        {
          title: "Terms and Conditions",
          icon: <NotepadText />,
          iconAfter: <ChevronRight />,
          onPress: () => void Linking.openURL(WEBSITE_URL.TERMS),
        },
      ],
    },
  ] satisfies SettingsGroupInput[];

  return (
    <BaseScreenView scrollable>
      <YStack gap="$4">
        {settingsGroups.map(renderSettingsGroup)}

        <Button size="$5" color="$red9" onPress={() => setIsModalVisible(true)}>
          Logout
        </Button>

        {__DEV__ && (
          <Button
            size="$5"
            color="$yellow10Dark"
            onPress={() => router.push("/_sitemap")}
          >
            Sitemap
          </Button>
        )}
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
