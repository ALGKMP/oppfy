import { useRouter } from "expo-router";
import { BookLock, ChevronRight, ShieldBan } from "@tamagui/lucide-icons";

import { ScreenView, SettingsGroup, Switch, YStack } from "~/components/ui";
import { usePrivacySettings } from "~/hooks/usePrivacySettings";

const Privacy = () => {
  const router = useRouter();
  const { privacySetting, onPrivacyChange } = usePrivacySettings();

  return (
    <ScreenView scrollable>
      <YStack gap="$4">
        <SettingsGroup title="Privacy">
          <SettingsGroup.Item
            title="Private Account"
            icon={<BookLock />}
            iconAfter={
              <Switch
                size="$3"
                onCheckedChange={onPrivacyChange}
                checked={privacySetting === "private"}
              >
                <Switch.Thumb animation="quick" />
              </Switch>
            }
            hoverTheme={false}
            pressTheme={false}
          />
          <SettingsGroup.Item
            title="Blocked Users"
            icon={<ShieldBan />}
            iconAfter={<ChevronRight />}
            onPress={() => router.push("/blocked")}
          />
        </SettingsGroup>
      </YStack>
    </ScreenView>
  );
};

export default Privacy;
