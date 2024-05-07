import { useState } from "react";
import { useRouter } from "expo-router";
import { BookLock, ChevronRight, ShieldBan } from "@tamagui/lucide-icons";
import { Switch, YStack } from "tamagui";

import type { SettingsGroupInput } from "~/components/Settings";
import { renderSettingsGroup } from "~/components/Settings";
import { ScreenBaseView } from "~/components/Views";

const Privacy = () => {
  const router = useRouter();

  const [privateAccount, setPrivateAccount] = useState(false);

  // TODO: Implement
  const onSubmit = (checked: boolean) => {
    console.log("onSubmit");
    setPrivateAccount(checked);
  };

  const settingsGroups = [
    {
      headerTitle: "Privacy",
      items: [
        {
          title: "Private Account",
          icon: <BookLock />,
          iconAfter: (
            <Switch
              size="$3"
              checked={privateAccount}
              onCheckedChange={onSubmit}
            >
              <Switch.Thumb animation="quick" />
            </Switch>
          ),
          hoverTheme: false,
          pressTheme: false,
        },
        {
          title: "Blocked Users",
          icon: <ShieldBan />,
          iconAfter: <ChevronRight />,
          onPress: () => router.push("/blocked-users"),
        },
      ],
    },
  ] satisfies SettingsGroupInput[];

  return (
    <ScreenBaseView scrollable>
      <YStack gap="$4">{settingsGroups.map(renderSettingsGroup)}</YStack>
    </ScreenBaseView>
  );
};

export default Privacy;
