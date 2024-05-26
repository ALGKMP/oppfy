import { api } from "~/utils/api";

const useFollowMutations = (userId: string) => {
  const utils = api.useUtils();

  const follow = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.follow.paginateFollowingOthers.cancel();

      // Get the data from the queryCache
      const prevData = utils.follow.paginateFollowingOthers.getInfiniteData({
        userId,
      });

      if (prevData === undefined) return;

      // Optimistically update the data
      utils.follow.paginateFollowingOthers.setInfiniteData(
        { userId },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.userId === newData.userId
                ? { ...item, isFollowing: true }
                : item,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      utils.follow.paginateFollowingOthers.setInfiniteData(
        { userId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.follow.paginateFollowingOthers.invalidate();
    },
  });

  const unfollow = api.follow.unfollowUser.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.follow.paginateFollowingOthers.cancel();

      // Get the data from the queryCache
      const prevData = utils.follow.paginateFollowingOthers.getInfiniteData({
        userId,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.follow.paginateFollowingOthers.setInfiniteData(
        { userId },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.userId === newData.userId
                ? { ...item, isFollowing: false }
                : item,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      utils.follow.paginateFollowingOthers.setInfiniteData(
        { userId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.follow.paginateFollowingOthers.invalidate();
    },
  });

  const cancelFollowRequest = api.follow.cancelFollowRequest.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.follow.paginateFollowingOthers.cancel();

      // Get the data from the queryCache
      const prevData = utils.follow.paginateFollowingOthers.getInfiniteData({
        userId,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.follow.paginateFollowingOthers.setInfiniteData(
        { userId },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.userId === newData.userId
                ? { ...item, isFollowing: false }
                : item,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: (_err, newData, ctx) => {
      if (ctx === undefined) return;
      utils.follow.paginateFollowingOthers.setInfiniteData(
        { userId: newData.userId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.follow.paginateFollowingOthers.invalidate();
    },
  });

  return { follow, unfollow, cancelFollowRequest };
};

export default useFollowMutations;
