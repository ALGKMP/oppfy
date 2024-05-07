import { useState } from "react";
import { useRouter } from "expo-router";
import { BookLock, ChevronRight, ShieldBan } from "@tamagui/lucide-icons";
import { Switch, YStack } from "tamagui";

import type { SettingsGroupInput } from "~/components/Settings";
import { renderSettingsGroup } from "~/components/Settings";
import { ScreenBaseView } from "~/components/Views";
import { api, RouterInputs, RouterOutputs } from "~/utils/api";

type Privacy = RouterOutputs["user"]["getPrivacySetting"];

const Privacy = () => {
  const router = useRouter();

  const utils = api.useUtils();

  const { data: privacy } = api.user.getPrivacySetting.useQuery();

  const updatePrivacySetting = api.user.updatePrivacySetting.useMutation({
    onMutate: async (newPrivacySettings) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.user.getPrivacySetting.cancel();

      // Get the data from the queryCache
      const prevData = utils.user.getPrivacySetting.getData();
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.user.getPrivacySetting.setData(
        undefined,
        newPrivacySettings.privacy,
      );

      // Return the previous data so we can revert if something goes wrong
      return { prevData };
    },
    onError: (_err, _newPrivacySettings, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.user.getPrivacySetting.setData(undefined, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.user.getPrivacySetting.invalidate();
    },
  });

  const [privateAccount, setPrivateAccount] = useState<Privacy>("private");

  // TODO: Implement
  const onSubmit = async (checked: boolean) => {
    console.log("onSubmit", checked);
    // setPrivateAccount(checked);

    const privacy = checked ? "private" : "public";
    await updatePrivacySetting.mutateAsync({ privacy });
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
              checked={privacy === "private"}
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
