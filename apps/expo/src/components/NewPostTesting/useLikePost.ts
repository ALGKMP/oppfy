import { useCallback, useRef } from "react";

import { api } from "~/utils/api";
import { useOptimisticUpdatePost } from "./useOptimicUpdatePost";
import type { Endpoint } from "./useOptimicUpdatePost";
import { useThrottleWithIncreaseDelay } from "./useThrottleWithIncreaseDelay";

interface LikePostProps {
  postId: string;
  endpoint: Endpoint;
  userId?: string;
}

export const useLikePost = ({ postId, endpoint, userId }: LikePostProps) => {
  const utils = api.useUtils();
  const { data: hasLiked } = api.post.hasliked.useQuery(
    { postId },
    { initialData: false },
  );

  const clickCount = useRef(0);
  const isLikingRef = useRef(false);
  const { changeLikeCount } = useOptimisticUpdatePost();
  const throttledLikeRequest = useRef(
    useThrottleWithIncreaseDelay(async (currentHasLiked: boolean) => {
      if (clickCount.current % 2 === 0) {
        clickCount.current = 0;
        return;
      }
      currentHasLiked
        ? await unlikePost.mutateAsync({ postId })
        : await likePost.mutateAsync({ postId });
      clickCount.current = 0;
      isLikingRef.current = false;
    }, 5000),
  );

  const likePost = api.post.likePost.useMutation({
    onMutate: async (newHasLikedData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.hasliked.cancel();

      // Get the data from the query cache
      const prevData = utils.post.hasliked.getData({
        postId: newHasLikedData.postId,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.post.hasliked.setData({ postId: newHasLikedData.postId }, true);

      // Return the previous data so we can revert if something goes wrong
      return { prevData };
    },
    onError: async (_err, newHasLikedData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.post.hasliked.setData(
        { postId: newHasLikedData.postId },
        ctx.prevData,
      );
      await changeLikeCount({
        endpoint,
        changeCountBy: -1,
        postId,
      });
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.post.hasliked.invalidate();
    },
  });

  const unlikePost = api.post.unlikePost.useMutation({
    onMutate: async (newHasLikedData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.hasliked.cancel();

      // Get the data from the query cache
      const prevData = utils.post.hasliked.getData({
        postId: newHasLikedData.postId,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.post.hasliked.setData({ postId: newHasLikedData.postId }, false);

      // Return the previous data so we can revert if something goes wrong
      return { prevData };
    },
    onError: async (_err, newHasLikedData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.post.hasliked.setData(
        { postId: newHasLikedData.postId },
        ctx.prevData,
      );
      await changeLikeCount({
        endpoint,
        changeCountBy: 1,
        postId,
      });
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.post.hasliked.invalidate();
    },
  });

  const handleLikePressed = useCallback(async () => {
    isLikingRef.current = true;

    // Optimistically update the UI
    await utils.post.hasliked.cancel();
    utils.post.hasliked.setData({ postId }, !hasLiked);
    await changeLikeCount({
      postId,
      changeCountBy: hasLiked ? -1 : 1,
      endpoint,
      userId,
    }); // Use the passed in endpoint

    // Call the throttled function
    clickCount.current++;
    throttledLikeRequest.current(hasLiked);
  }, [
    hasLiked,
    postId,
    utils.post.hasliked,
    changeLikeCount,
    endpoint,
    userId,
  ]);

  const handleLikeDoubleTapped = async () => {
    if (!hasLiked) {
      await utils.post.hasliked.cancel();
      utils.post.hasliked.setData({ postId }, !hasLiked);
      await changeLikeCount({
        postId,
        changeCountBy: 1,
        endpoint,
        userId,
      }); // Use the passed in endpoint
      clickCount.current++;
      throttledLikeRequest.current(hasLiked);
    }
  };

  return { hasLiked, handleLikePressed, handleLikeDoubleTapped };
};
