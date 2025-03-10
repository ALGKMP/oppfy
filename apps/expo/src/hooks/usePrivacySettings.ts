import { useActionSheetController } from "~/components/ui";
import { api } from "~/utils/api";

export const usePrivacySettings = () => {
  const actionSheet = useActionSheetController();
  const utils = api.useUtils();

  // Get privacy setting
  const { data: privacySetting } = api.user.getPrivacy.useQuery(undefined, {
    initialData: "public",
  });

  // Mutation for privacy setting
  const updatePrivacy = api.user.updatePrivacy.useMutation({
    onMutate: async (newPrivacySettings) => {
      await utils.user.getPrivacy.cancel();
      const prevData = utils.user.getPrivacy.getData();
      if (prevData === undefined) return;

      utils.user.getPrivacy.setData(undefined, newPrivacySettings.privacy);

      return { prevData };
    },
    onError: (_err, _newPrivacySettings, ctx) => {
      if (ctx === undefined) return;
      utils.user.getPrivacy.setData(undefined, ctx.prevData);
    },
    onSettled: async () => {
      await utils.user.getPrivacy.invalidate();
    },
  });

  const handlePrivacySettingUpdate = async (
    newPrivacySetting: "private" | "public",
  ) => {
    await updatePrivacy.mutateAsync({
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
