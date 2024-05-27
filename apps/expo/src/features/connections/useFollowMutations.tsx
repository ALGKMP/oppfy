import { api } from "~/utils/api";

type QueryKeys =
  | "follow.paginateFollowingOthers"
  | "follow.paginateFollowersOthers"
  | "friend.paginateFriendsOthers";

const useFollowHandlers = (
  userId: string,
  queryToOptimisticallyUpdate: QueryKeys,
  queriesToInvalidate: QueryKeys[],
) => {
  const utils = api.useUtils();

  const getQueryByKey = (key: QueryKeys) => {
    switch (key) {
      case "follow.paginateFollowingOthers":
        return utils.follow.paginateFollowingOthers;
      case "follow.paginateFollowersOthers":
        return utils.follow.paginateFollowersOthers;
      case "friend.paginateFriendsOthers":
        return utils.friend.paginateFriendsOthers;
    }
  };

  const followMutation = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      const query = getQueryByKey(queryToOptimisticallyUpdate);

      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await query.cancel();

      // Get the data from the queryCache
      const prevData = query.getInfiniteData({
        userId,
        pageSize: 20,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      query.setInfiniteData(
        { userId, pageSize: 20 },
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

      return { query, prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      ctx.query.setInfiniteData({ userId, pageSize: 20 }, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await Promise.all(
        queriesToInvalidate.map((key) => getQueryByKey(key).invalidate()),
      );
    },
  });

  const unfollowMutation = api.follow.unfollowUser.useMutation({
    onMutate: async (newData) => {
      const query = getQueryByKey(queryToOptimisticallyUpdate);

      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await query.cancel();

      // Get the data from the queryCache
      const prevData = query.getInfiniteData({
        userId,
        pageSize: 20,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      query.setInfiniteData(
        { userId, pageSize: 20 },
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

      return { query, prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      ctx.query.setInfiniteData({ userId, pageSize: 20 }, ctx.prevData);
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await Promise.all(
        queriesToInvalidate.map((key) => getQueryByKey(key).invalidate()),
      );
    },
  });

  const cancelFollowRequestMutation =
    api.follow.cancelFollowRequest.useMutation({
      onMutate: async (newData) => {
        const query = getQueryByKey(queryToOptimisticallyUpdate);

        // Cancel outgoing fetches (so they don't overwrite our optimistic update)
        await query.cancel();

        // Get the data from the queryCache
        const prevData = query.getInfiniteData({
          userId,
          pageSize: 20,
        });
        if (prevData === undefined) return;

        // Optimistically update the data
        query.setInfiniteData(
          { userId, pageSize: 20 },
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

        return { query, prevData };
      },
      onError: (_err, newData, ctx) => {
        if (ctx === undefined) return;
        ctx.query.setInfiniteData(
          { userId: newData.userId, pageSize: 20 },
          ctx.prevData,
        );
      },
      onSettled: async () => {
        // Sync with server once mutation has settled
        await Promise.all(
          queriesToInvalidate.map((key) => getQueryByKey(key).invalidate()),
        );
      },
    });

  const follow = async (userId: string) => {
    await followMutation.mutateAsync({ userId });
  };

  const unfollow = async (userId: string) => {
    await unfollowMutation.mutateAsync({ userId });
  };

  const cancelFollowRequest = async (userId: string) => {
    await cancelFollowRequestMutation.mutateAsync({ userId });
  };

  return { follow, unfollow, cancelFollowRequest };
};

export default useFollowHandlers;
