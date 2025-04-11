import { Image, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as StoreReview from "expo-store-review";
import Logo from "@assets/icons/icon.png";
import {
  BellRing,
  ChevronRight,
  FileLock2,
  Hammer,
  Heart,
  NotepadText,
  Share2,
  ShieldCheck,
  Star,
} from "@tamagui/lucide-icons";
import { getToken } from "tamagui";

import {
  Button,
  ScreenView,
  SettingsGroup,
  Text,
  useAlertDialogController,
  XStack,
  YStack,
} from "~/components/ui";
import { useAuth } from "~/hooks/useAuth";

enum WEBSITE_URL {
  PRIVACY = "https://www.oppfy.app/privacy",
  TERMS = "https://www.oppfy.app/terms",
}

const Settings = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const alertDialog = useAlertDialogController();

  const { signOut } = useAuth();

  const handleShare = async () => {
    await Share.share({
      title: "Join me on Oppfy!",
      message:
        "Check out Oppfy - the social media app where your friends capture your best moments! Download now:",
      url: "https://www.oppfy.app",
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
      signOut();
    }
  };

  return (
    <ScreenView
      scrollable
      contentContainerStyle={{
        flexGrow: 1,
      }}
    >
      <YStack flex={1} gap="$4">
        <SettingsGroup title="Settings">
          <SettingsGroup.Item
            title="Notifications"
            icon={<BellRing />}
            iconAfter={<ChevronRight />}
            onPress={() => router.push("/notifications")}
          />
          <SettingsGroup.Item
            title="Privacy"
            icon={<ShieldCheck />}
            iconAfter={<ChevronRight />}
            onPress={() => router.push("/privacy")}
          />
          <SettingsGroup.Item
            title="Other"
            icon={<Hammer />}
            iconAfter={<ChevronRight />}
            onPress={() => router.push("/other")}
          />
        </SettingsGroup>

        <SettingsGroup title="Other">
          <SettingsGroup.Item
            title="Share Us"
            icon={<Share2 />}
            iconAfter={<ChevronRight />}
            onPress={() => void handleShare()}
          />
          <SettingsGroup.Item
            title="Rate Us"
            icon={<Star />}
            iconAfter={<ChevronRight />}
            onPress={() => void handleRate()}
          />
          <SettingsGroup.Item
            title="Privacy Policy"
            icon={<FileLock2 />}
            iconAfter={<ChevronRight />}
            onPress={() => void Linking.openURL(WEBSITE_URL.PRIVACY)}
          />
          <SettingsGroup.Item
            title="Terms and Conditions"
            icon={<NotepadText />}
            iconAfter={<ChevronRight />}
            onPress={() => void Linking.openURL(WEBSITE_URL.TERMS)}
          />
        </SettingsGroup>

        <Button variant="danger" onPress={handleLogout}>
          Logout
        </Button>

        {__DEV__ && (
          <Button variant="warning" onPress={() => router.push("/_sitemap")}>
            Sitemap
          </Button>
        )}
      </YStack>

      <YStack
        alignItems="center"
        paddingBottom={(insets.bottom + getToken("$2", "space")) as number}
        gap="$4"
      >
        <Image
          source={Logo}
          style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            marginBottom: 4,
          }}
        />

        <YStack alignItems="center" gap="$2">
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$3">made with</Text>
            <Heart size={16} color="$red11" />
            <Text fontSize="$3">by oppfy</Text>
          </XStack>

          <Text color="$gray11" fontSize="$2" fontWeight="400">
            v{Constants.expoConfig?.version ?? "1.0.0"}
          </Text>
        </YStack>
      </YStack>
    </ScreenView>
  );
};

export default Settings;
