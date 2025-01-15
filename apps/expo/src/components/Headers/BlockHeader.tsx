import { TouchableOpacity } from "react-native";
import { MoreHorizontal } from "@tamagui/lucide-icons";

import { View } from "~/components/ui";
import {
  ButtonOption,
  useActionSheetController,
} from "~/components/ui/ActionSheet";
import { api } from "~/utils/api";

const BlockUserHeader = ({ userId }: { userId: string }) => {
  const utils = api.useUtils();
  const { show } = useActionSheetController();
  const { isBlocking, isUnblocking, handleBlockUser, handleUnblockUser } =
    useBlockUser(userId);

  const networkRelationships = utils.profile.getNetworkRelationships.getData({
    userId,
  });

  const sheetButtonOptions: ButtonOption[] = [
    {
      text: networkRelationships?.blocked
        ? isUnblocking
          ? "Unblocking..."
          : "Unblock User"
        : isBlocking
          ? "Blocking..."
          : "Block User",
      textProps: {
        color: isBlocking || isUnblocking ? "$gray9" : "$red9",
      },
      autoClose: false,
      disabled: isBlocking || isUnblocking,
      onPress: networkRelationships?.blocked
        ? isUnblocking
          ? handleUnblockUser
          : handleBlockUser
        : isBlocking
          ? handleUnblockUser
          : handleBlockUser,
    },
  ];

  return (
    <View>
      <TouchableOpacity
        onPress={() => show({ buttonOptions: sheetButtonOptions })}
      >
        <MoreHorizontal />
      </TouchableOpacity>
    </View>
  );
};

/*
 * ==========================================
 * ============== hooks =====================
 * ==========================================
 */

const useBlockUser = (userId: string) => {
  const utils = api.useUtils();

  const { isPending: isUnblocking, mutateAsync: unblockUser } =
    api.block.unblockUser.useMutation({
      onMutate: async () => {
        await utils.profile.getNetworkRelationships.cancel({ userId });
        const prevData = utils.profile.getNetworkRelationships.getData({
          userId,
        });
        if (prevData === undefined) return;
        utils.profile.getNetworkRelationships.setData(
          { userId },
          {
            ...prevData,
            blocked: false,
          },
        );
        return { prevData };
      },
      onError: (error, _newUnblockedUser, context) => {
        console.error(error);
        if (context === undefined) return;
        utils.profile.getNetworkRelationships.setData(
          { userId },
          context.prevData,
        );
      },
      onSettled: async () => {
        await utils.profile.getNetworkRelationships.invalidate({ userId });
      },
    });

  const { isPending: isBlocking, mutateAsync: blockUser } =
    api.block.blockUser.useMutation({
      onMutate: async () => {
        await utils.profile.getNetworkRelationships.cancel({ userId });
        const prevData = utils.profile.getNetworkRelationships.getData({
          userId,
        });
        if (prevData === undefined) return;
        utils.profile.getNetworkRelationships.setData(
          { userId },
          {
            ...prevData,
            blocked: true,
          },
        );
        return { prevData };
      },
      onError: (error, _newBlockedUser, context) => {
        console.error(error);
        if (context === undefined) return;
        utils.profile.getNetworkRelationships.setData(
          { userId },
          context.prevData,
        );
      },
      onSettled: async () => {
        await utils.profile.getNetworkRelationships.invalidate({ userId });
      },
    });

  const handleBlockUser = async () => {
    await blockUser({ userId });
  };

  const handleUnblockUser = async () => {
    await unblockUser({ userId });
  };

  return { isBlocking, isUnblocking, handleBlockUser, handleUnblockUser };
};

export default BlockUserHeader;
