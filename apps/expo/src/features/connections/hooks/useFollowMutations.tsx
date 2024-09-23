import { api } from "~/utils/api";

type QueryKeys =
  | "follow.paginateFollowingOthers"
  | "follow.paginateFollowersOthers"
  | "friend.paginateFriendsOthers";

interface FollowHandlerParams {
  userId: string;
  queryToOptimisticallyUpdate: QueryKeys;
  queriesToInvalidate: QueryKeys[];
}

const useFollowHandlers = ({
  userId,
  queryToOptimisticallyUpdate,
  queriesToInvalidate,
}: FollowHandlerParams) => {
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
                ? { ...item, relationshipState: "following" }
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
      await Promise.all([
        ...queriesToInvalidate.map((key) => getQueryByKey(key).invalidate()),
        utils.profile.getFullProfileOther.invalidate({ userId }),
      ]);
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
                ? { ...item, relationshipState: "notFollowing" }
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
                item.userId === newData.recipientId
                  ? { ...item, relationshipState: "notFollowing" }
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
          { userId: newData.recipientId, pageSize: 20 },
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

  const cancelFollowRequest = async (senderId: string) => {
    await cancelFollowRequestMutation.mutateAsync({ recipientId: senderId });
  };

  return { follow, unfollow, cancelFollowRequest };
};

export default useFollowHandlers;
