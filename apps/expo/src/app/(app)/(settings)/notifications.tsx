import { useEffect, useState } from "react";
import {
  AtSign,
  MessageCircle,
  StickyNote,
  ThumbsUp,
  UserRoundPlus,
} from "@tamagui/lucide-icons";

import {
  Button,
  ScreenView,
  SettingsGroup,
  Spinner,
  Switch,
  YStack,
} from "~/components/ui";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

type SwitchState = RouterOutputs["notifications"]["getNotificationSettings"];

const Notifications = () => {
  const utils = api.useUtils();

  const { data: notificationSettings } =
    api.notifications.getNotificationSettings.useQuery(undefined, {
      initialData: {
        likes: false,
        posts: false,
        comments: false,
        mentions: false,
        friendRequests: false,
        followRequests: false,
      },
    });

  const updateNotificationSettings =
    api.notifications.updateNotificationSettings.useMutation({
      onMutate: async (newNotificationSettings) => {
        // Cancel outgoing fetches (so they don't overwrite our optimistic update)
        await utils.notifications.getNotificationSettings.cancel();

        // Get the data from the queryCache
        const prevData = utils.notifications.getNotificationSettings.getData();
        if (prevData === undefined) return;

        // Optimistically update the data
        utils.notifications.getNotificationSettings.setData(undefined, {
          ...prevData,
          ...newNotificationSettings,
        });

        // Return the previous data so we can revert if something goes wrong
        return { prevData };
      },
      onError: (_err, _newNoticationSettings, ctx) => {
        if (ctx === undefined) return;

        // If the mutation fails, use the context-value from onMutate
        utils.notifications.getNotificationSettings.setData(
          undefined,
          ctx.prevData,
        );
      },
      onSettled: async () => {
        // Sync with server once mutation has settled
        await utils.notifications.getNotificationSettings.invalidate();
      },
    });

  const [switchState, setSwitchState] =
    useState<SwitchState>(notificationSettings);

  const hasChanges = () => {
    return Object.keys(switchState).some(
      (key) =>
        switchState[key as keyof SwitchState] !==
        notificationSettings[key as keyof SwitchState],
    );
  };

  const updateSwitchState = (key: keyof SwitchState, value: boolean) => {
    setSwitchState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
    setSwitchState(notificationSettings);
  }, [notificationSettings]);

  const onSubmit = async () => {
    await updateNotificationSettings.mutateAsync(switchState);
  };

  return (
    <ScreenView scrollable>
      <YStack gap="$4">
        <SettingsGroup title="Notifications">
          <SettingsGroup.Item
            title="Posts"
            icon={<StickyNote />}
            iconAfter={
              <Switch
                size="$3"
                checked={switchState.posts}
                onCheckedChange={(value) => updateSwitchState("posts", value)}
              >
                <Switch.Thumb animation="quick" />
              </Switch>
            }
            hoverTheme={false}
            pressTheme={false}
          />
          <SettingsGroup.Item
            title="Likes"
            icon={<ThumbsUp />}
            iconAfter={
              <Switch
                size="$3"
                checked={switchState.likes}
                onCheckedChange={(value) => updateSwitchState("likes", value)}
              >
                <Switch.Thumb animation="quick" />
              </Switch>
            }
            hoverTheme={false}
            pressTheme={false}
          />
          <SettingsGroup.Item
            title="Comments"
            icon={<MessageCircle />}
            iconAfter={
              <Switch
                size="$3"
                checked={switchState.comments}
                onCheckedChange={(value) =>
                  updateSwitchState("comments", value)
                }
              >
                <Switch.Thumb animation="quick" />
              </Switch>
            }
            hoverTheme={false}
            pressTheme={false}
          />
          <SettingsGroup.Item
            title="Mentions"
            icon={<AtSign />}
            iconAfter={
              <Switch
                size="$3"
                checked={switchState.mentions}
                onCheckedChange={(value) =>
                  updateSwitchState("mentions", value)
                }
              >
                <Switch.Thumb animation="quick" />
              </Switch>
            }
            hoverTheme={false}
            pressTheme={false}
          />
          <SettingsGroup.Item
            title="Follow Requests"
            icon={<UserRoundPlus />}
            iconAfter={
              <Switch
                size="$3"
                checked={switchState.followRequests}
                onCheckedChange={(value) =>
                  updateSwitchState("followRequests", value)
                }
              >
                <Switch.Thumb animation="quick" />
              </Switch>
            }
            hoverTheme={false}
            pressTheme={false}
          />
          <SettingsGroup.Item
            title="Friend Requests"
            icon={<UserRoundPlus />}
            iconAfter={
              <Switch
                size="$3"
                checked={switchState.friendRequests}
                onCheckedChange={(value) =>
                  updateSwitchState("friendRequests", value)
                }
              >
                <Switch.Thumb animation="quick" />
              </Switch>
            }
            hoverTheme={false}
            pressTheme={false}
          />
        </SettingsGroup>
        <Button
          onPress={onSubmit}
          disabled={!hasChanges() || updateNotificationSettings.isPending}
          opacity={!hasChanges() ? 0.5 : 1}
        >
          {updateNotificationSettings.isPending ? <Spinner /> : "Save"}
        </Button>
      </YStack>
    </ScreenView>
  );
};

export default Notifications;
