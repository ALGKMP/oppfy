import { useRouter } from "expo-router";
import { BookLock, ChevronRight, ShieldBan } from "@tamagui/lucide-icons";

import {
  ScreenView,
  SettingsGroup,
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
      await utils.user.getPrivacySetting.cancel();
      const prevData = utils.user.getPrivacySetting.getData();
      if (prevData === undefined) return;

      utils.user.getPrivacySetting.setData(
        undefined,
        newPrivacySettings.privacy,
      );

      return { prevData };
    },
    onError: (_err, _newPrivacySettings, ctx) => {
      if (ctx === undefined) return;
      utils.user.getPrivacySetting.setData(undefined, ctx.prevData);
    },
    onSettled: async () => {
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
                onCheckedChange={onSubmit}
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
