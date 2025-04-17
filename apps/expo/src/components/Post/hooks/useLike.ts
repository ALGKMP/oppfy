import { api } from "~/utils/api";

interface UseLikeParams {
  postId: string;
}

const useLike = ({ postId }: UseLikeParams) => {
  const utils = api.useUtils();

  const likePostMutation = api.postInteraction.likePost.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.getIsLiked.cancel();
      await utils.post.getPostStats.cancel();

      // Get the data from the query cache
      const prevIsLikedData = utils.post.getIsLiked.getData({
        postId: newData.postId,
      });
      const prevPostStatsData = utils.post.getPostStats.getData({
        postId: newData.postId,
      });

      if (prevIsLikedData === undefined) return;
      if (prevPostStatsData === undefined) return;

      // Optimistically update the data
      utils.post.getIsLiked.setData({ postId: newData.postId }, true);
      utils.post.getPostStats.setData(
        { postId: newData.postId },
        {
          ...prevPostStatsData,
          likes: prevPostStatsData.likes + 1,
        },
      );

      // Return the previous data so we can revert if something goes wrong
      return { prevData: { prevPostStatsData, prevIsLikedData } };
    },
    onError: async (_err, newData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.post.getIsLiked.setData(
        { postId: newData.postId },
        ctx.prevData.prevIsLikedData,
      );
      utils.post.getPostStats.setData(
        { postId: newData.postId },
        ctx.prevData.prevPostStatsData,
      );

      await utils.post.getPostStats.invalidate({ postId });
      await utils.post.getIsLiked.invalidate({ postId });
    },
  });

  const unlikePostMutation = api.postInteraction.unlikePost.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.getIsLiked.cancel();
      await utils.post.getPostStats.cancel();

      // Get the data from the query cache
      const prevIsLikedData = utils.post.getIsLiked.getData({
        postId: newData.postId,
      });
      const prevPostStatsData = utils.post.getPostStats.getData({
        postId: newData.postId,
      });

      if (prevIsLikedData === undefined) return;
      if (prevPostStatsData === undefined) return;

      // Optimistically update the data
      utils.post.getIsLiked.setData({ postId: newData.postId }, false);
      utils.post.getPostStats.setData(
        { postId: newData.postId },
        {
          ...prevPostStatsData,
          likes: prevPostStatsData.likes - 1,
        },
      );

      // Return the previous data so we can revert if something goes wrong
      return { prevData: { prevPostStatsData, prevIsLikedData } };
    },
    onError: async (_err, newData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.post.getIsLiked.setData(
        { postId: newData.postId },
        ctx.prevData.prevIsLikedData,
      );
      utils.post.getPostStats.setData(
        { postId: newData.postId },
        ctx.prevData.prevPostStatsData,
      );

      await utils.post.getPostStats.invalidate({ postId });
      await utils.post.getIsLiked.invalidate({ postId });
    },
  });

  const likePost = async () => {
    await likePostMutation.mutateAsync({ postId });
  };

  const unlikePost = async () => {
    await unlikePostMutation.mutateAsync({ postId });
  };

  return {
    likePost,
    unlikePost,
  };
};

export { useLike };
