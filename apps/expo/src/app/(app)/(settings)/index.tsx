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

import {
  Button,
  renderSettingsList,
  ScreenView,
  SettingsListInput,
  useAlertDialogController,
  YStack,
} from "~/components/ui";
import { useSession } from "~/contexts/SessionContext";

enum WEBSITE_URL {
  PRIVACY = "https://oppfy.app/privacy",
  TERMS = "https://oppfy.app/terms",
}

const Settings = () => {
  const router = useRouter();
  const { signOut } = useSession();
  const alertDialog = useAlertDialogController();

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

  const handleLogout = async () => {
    const confirmed = await alertDialog.show({
      title: "Log Out",
      subtitle: "Are you sure you want to log out?",
      acceptText: "Log Out",
      cancelText: "Cancel",
      acceptTextProps: {
        color: "$red9",
      },
    });

    if (confirmed) {
      void signOut();
    }
  };

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
  ] satisfies SettingsListInput[];

  return (
    <ScreenView scrollable>
      <YStack gap="$4">
        {settingsGroups.map(renderSettingsList)}

        <Button size="$5" color="$red10" onPress={handleLogout}>
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
    </ScreenView>
  );
};

export default Settings;
