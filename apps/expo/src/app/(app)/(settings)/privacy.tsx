import { useRouter } from "expo-router";
import { BookLock, ChevronRight, ShieldBan } from "@tamagui/lucide-icons";

import {
  renderSettingsList,
  ScreenView,
  SettingsListInput,
  Switch,
  useActionSheetController,
  YStack,
} from "~/components/ui";
import type { RouterInputs } from "~/utils/api";
import { api } from "~/utils/api";

type PrivacySetting = RouterInputs["user"]["updatePrivacySetting"]["privacy"];

const Privacy = () => {
  const router = useRouter();
  const utils = api.useUtils();
  const actionSheet = useActionSheetController();

  const { data: privacySetting } = api.user.getPrivacySetting.useQuery(
    undefined,
    {
      initialData: "public",
    },
  );

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

  const handlePrivacySettingUpdate = async (
    newPrivacySetting: PrivacySetting,
  ) => {
    await updatePrivacySetting.mutateAsync({
      privacy: newPrivacySetting,
    });
  };

  const onSubmit = async (checked: boolean) => {
    const newPrivacySetting = (
      checked ? "private" : "public"
    ) satisfies PrivacySetting;

    if (newPrivacySetting === "private") {
      actionSheet.show({
        title: "Switch to private account?",
        subtitle:
          "Only your followers will be able to see your photos and videos.",
        buttonOptions: [
          {
            text: "Switch to private",
            onPress: async () => await handlePrivacySettingUpdate("private"),
          },
        ],
      });
    } else {
      await handlePrivacySettingUpdate("public");
    }
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
              onCheckedChange={onSubmit}
              checked={privacySetting === "private"}
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
  ] satisfies SettingsListInput[];

  return (
    <ScreenView scrollable>
      <YStack gap="$4">{settingsGroups.map(renderSettingsList)}</YStack>
    </ScreenView>
  );
};

export default Privacy;
