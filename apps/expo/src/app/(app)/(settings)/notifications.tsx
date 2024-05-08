import { useEffect, useState } from "react";
import { MessageCircle, StickyNote, UsersRound } from "@tamagui/lucide-icons";
import { Button, Spinner, Switch, YStack } from "tamagui";

import type { SettingsGroupInput } from "~/components/Settings";
import { renderSettingsGroup } from "~/components/Settings";
import { ScreenBaseView } from "~/components/Views";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

type SwitchState = RouterOutputs["user"]["getNotificationSettings"];

const Notifications = () => {
  const utils = api.useUtils();

  const {
    data: notificationSettings,
    isLoading: isLoadingNotificationSettings,
  } = api.user.getNotificationSettings.useQuery(undefined, {
    initialData: {
      likes: false,
      posts: false,
      comments: false,
      mentions: false,
      friendRequests: false,
      followRequests: false,
    },
  });

  const {
    isLoading: isUpdatingNotficationSettings,
    ...updateNotificationSettings
  } = api.user.updateNotificationSettings.useMutation({
    onMutate: async (newNotificationSettings) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.user.getNotificationSettings.cancel();

      // Get the data from the queryCache
      const prevData = utils.user.getNotificationSettings.getData();
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.user.getNotificationSettings.setData(undefined, {
        ...prevData,
        ...newNotificationSettings,
      });

      // Return the previous data so we can revert if something goes wrong
      return { prevData };
    },
    onError: (_err, _newNoticationSettings, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.user.getNotificationSettings.setData(undefined, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.user.getNotificationSettings.invalidate();
    },
  });

  const [switchState, setSwitchState] =
    useState<SwitchState>(notificationSettings);

  const updateSwitchState = (key: keyof SwitchState, value: boolean) => {
    setSwitchState({ ...switchState, [key]: value });
  };

  useEffect(() => {
    if (!isLoadingNotificationSettings) {
      setSwitchState(notificationSettings);
    }
  }, [isLoadingNotificationSettings, notificationSettings]);

  const onSubmit = async () => {
    await updateNotificationSettings.mutateAsync(switchState);
  };

  const settingsGroups = [
    {
      headerTitle: "Notifications",
      items: [
        {
          title: "Posts",
          icon: <StickyNote />,
          iconAfter: (
            <Switch
              size="$3"
              checked={switchState.posts}
              onCheckedChange={(value) => updateSwitchState("posts", value)}
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
  ] satisfies SettingsGroupInput[];

  return (
    <ScreenBaseView scrollable>
      <YStack gap="$4">
        {settingsGroups.map(renderSettingsGroup)}
        <Button size="$4.5" onPress={onSubmit}>
          {isUpdatingNotficationSettings ? <Spinner /> : "Save"}
        </Button>
      </YStack>
    </ScreenBaseView>
  );
};

export default Notifications;
