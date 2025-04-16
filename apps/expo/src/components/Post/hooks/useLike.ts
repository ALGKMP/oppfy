import { api } from "~/utils/api";

interface UseLikeParams {
  postId: string;
}

export const useLike = ({ postId }: UseLikeParams) => {
  const utils = api.useUtils();

  const likePostMutation = api.postInteraction.likePost.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.getHasLiked.cancel();
      await utils.post.getPostStats.cancel();

      // Get the data from the query cache
      const prevHasLikedData = utils.post.getHasLiked.getData({
        postId: newData.postId,
      });
      const prevPostStatsData = utils.post.getPostStats.getData({
        postId: newData.postId,
      });

      if (prevHasLikedData === undefined) return;
      if (prevPostStatsData === undefined) return;

      // Optimistically update the data
      utils.post.getHasLiked.setData({ postId: newData.postId }, true);
      utils.post.getPostStats.setData(
        { postId: newData.postId },
        {
          ...prevPostStatsData,
          likes: prevPostStatsData.likes + 1,
        },
      );

      // Return the previous data so we can revert if something goes wrong
      return { prevData: { prevPostStatsData, prevHasLikedData } };
    },
    onError: async (_err, newData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.post.getHasLiked.setData(
        { postId: newData.postId },
        ctx.prevData.prevHasLikedData,
      );
      utils.post.getPostStats.setData(
        { postId: newData.postId },
        ctx.prevData.prevPostStatsData,
      );

      await utils.post.getPostStats.invalidate({ postId });
      await utils.post.getHasLiked.invalidate({ postId });
    },
  });

  const unlikePostMutation = api.postInteraction.unlikePost.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.getHasLiked.cancel();
      await utils.post.getPostStats.cancel();

      // Get the data from the query cache
      const prevHasLikedData = utils.post.getHasLiked.getData({
        postId: newData.postId,
      });
      const prevPostStatsData = utils.post.getPostStats.getData({
        postId: newData.postId,
      });

      if (prevHasLikedData === undefined) return;
      if (prevPostStatsData === undefined) return;

      // Optimistically update the data
      utils.post.getHasLiked.setData({ postId: newData.postId }, false);
      utils.post.getPostStats.setData(
        { postId: newData.postId },
        {
          ...prevPostStatsData,
          likes: prevPostStatsData.likes - 1,
        },
      );

      // Return the previous data so we can revert if something goes wrong
      return { prevData: { prevPostStatsData, prevHasLikedData } };
    },
    onError: async (_err, newData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.post.getHasLiked.setData(
        { postId: newData.postId },
        ctx.prevData.prevHasLikedData,
      );
      utils.post.getPostStats.setData(
        { postId: newData.postId },
        ctx.prevData.prevPostStatsData,
      );

      await utils.post.getPostStats.invalidate({ postId });
      await utils.post.getHasLiked.invalidate({ postId });
    },
  });

  const likePost = () => {
    likePostMutation.mutate({ postId });
  };

  const unlikePost = () => {
    unlikePostMutation.mutate({ postId });
  };

  return {
    likePost,
    unlikePost,
  };
};
