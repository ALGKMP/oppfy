import { useState } from "react";
import { useRouter } from "expo-router";
import { MessageCircle, StickyNote, UsersRound } from "@tamagui/lucide-icons";
import { Button, Switch, YStack } from "tamagui";

import type { SettingsGroup } from "~/components/Settings";
import { renderSettingsGroup } from "~/components/Settings";
import { ScreenBaseView } from "~/components/Views";

interface SwitchState {
  friendPosts: boolean;
  comments: boolean;
  friendRequests: boolean;
}

const Notifications = () => {
  const [switchState, setSwitchState] = useState<SwitchState>({
    friendPosts: false,
    comments: false,
    friendRequests: false,
  });

  const updateSwitchState = (key: keyof SwitchState, value: boolean) => {
    setSwitchState({ ...switchState, [key]: value });
  };

  // TODO: Implement
  const onSubmit = () => {
    console.log("onSubmit");
  };

  const settingsGroups = [
    {
      headerTitle: "Notifications",
      items: [
        {
          title: "Friends Posts",
          icon: <StickyNote />,
          iconAfter: (
            <Switch
              size="$3"
              checked={switchState.friendPosts}
              onCheckedChange={(value) =>
                updateSwitchState("friendPosts", value)
              }
            >
              <Switch.Thumb animation="quick" />
            </Switch>
          ),
          hoverTheme: false,
          pressTheme: false,
        },
        {
          title: "Comments",
          icon: <MessageCircle />,
          iconAfter: (
            <Switch
              size="$3"
              checked={switchState.comments}
              onCheckedChange={(value) => updateSwitchState("comments", value)}
            >
              <Switch.Thumb animation="quick" />
            </Switch>
          ),
          hoverTheme: false,
          pressTheme: false,
        },
        {
          title: "Friend Requests",
          icon: <UsersRound />,
          iconAfter: (
            <Switch
              size="$3"
              checked={switchState.friendRequests}
              onCheckedChange={(value) =>
                updateSwitchState("friendRequests", value)
              }
            >
              <Switch.Thumb animation="quick" />
            </Switch>
          ),
          hoverTheme: false,
          pressTheme: false,
        },
      ],
    },
  ] satisfies SettingsGroup[];

  return (
    <ScreenBaseView scrollable>
      <YStack gap="$4">
        {settingsGroups.map(renderSettingsGroup)}
        <Button size="$4.5" onPress={onSubmit}>
          Save
        </Button>
      </YStack>
    </ScreenBaseView>
  );
};

export default Notifications;
