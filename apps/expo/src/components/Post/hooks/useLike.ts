import { useRef } from "react";

import { api } from "~/utils/api";

interface UseLikeParams {
  postId: string;
}

export const useLike = ({ postId }: UseLikeParams) => {
  const utils = api.useUtils();

  const likePostMutation = api.postInteraction.likePost.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.getPostStats.cancel();

      // Get the data from the query cache
      const prevData = utils.post.getPostStats.getData({
        postId: newData.postId,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.post.getPostStats.setData(
        { postId: newData.postId },
        {
          ...prevData,
          likes: prevData.likes + 1,
        },
      );

      utils.post.has

      // Return the previous data so we can revert if something goes wrong
      return { prevData };
    },
    onError: async (_err, newHasLikedData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.post.getPostStats.setData(
        { postId: newHasLikedData.postId },
        ctx.prevData,
      );
      await utils.post.getPostStats.invalidate({ postId });
    },
  });

  const unlikePostMutation = api.postInteraction.unlikePost.useMutation({
    onMutate: async (newHasLikedData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.getPostStats.cancel();

      // Get the data from the query cache
      const prevData = utils.post.getPostStats.getData({
        postId: newHasLikedData.postId,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.post.getPostStats.setData(
        { postId: newHasLikedData.postId },
        {
          ...prevData,
          likes: prevData.likes - 1,
          hasLiked: false,
        },
      );

      // Return the previous data so we can revert if something goes wrong
      return { prevData };
    },
    onError: async (_err, newHasLikedData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.post.getPostStats.setData(
        { postId: newHasLikedData.postId },
        ctx.prevData,
      );
      await utils.post.getPostStats.invalidate({ postId });
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.post.getPostStats.invalidate({ postId });
    },
  });

  return {
    postStats,
    handleLikeDoubleTapped,
  };
};
