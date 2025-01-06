import { useActionSheetController } from "~/components/ui";
import { api } from "~/utils/api";

export const usePrivacySettings = () => {
  const actionSheet = useActionSheetController();
  const utils = api.useUtils();

  // Get privacy setting
  const { data: privacySetting } = api.user.getPrivacySetting.useQuery(
    undefined,
    {
      initialData: "public",
    },
  );

  // Mutation for privacy setting
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
    newPrivacySetting: "private" | "public",
  ) => {
    await updatePrivacySetting.mutateAsync({
      privacy: newPrivacySetting,
    });
  };

  const onPrivacyChange = async (checked: boolean) => {
    const newPrivacySetting = checked ? "private" : "public";

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

  return {
    privacySetting,
    onPrivacyChange,
  };
};
