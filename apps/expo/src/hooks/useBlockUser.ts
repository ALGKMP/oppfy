import { api } from "~/utils/api";

export const useBlockUser = (userId: string) => {
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

  return {
    isBlocking,
    isUnblocking,
    handleBlockUser,
    handleUnblockUser,
    isLoading: isBlocking || isUnblocking,
  };
};
