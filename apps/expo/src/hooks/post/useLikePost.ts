import { useRef } from "react";

import { api } from "~/utils/api";
import { useOptimisticUpdatePost } from "./useOptimisticUpdatePost";
import type { Endpoint } from "./useOptimisticUpdatePost";
import { useThrottleWithIncreaseDelay } from "./useThrottleWithIncreaseDelay";

interface LikePostProps {
  postId: string;
  endpoint: Endpoint;
  userId?: string;
  initialHasLiked: boolean;
}

export const useLikePost = ({
  postId,
  endpoint,
  userId,
  initialHasLiked,
}: LikePostProps) => {
  const utils = api.useUtils();
  const { data: hasLiked } = api.postInteraction.hasLiked.useQuery(
    { postId },
    { initialData: initialHasLiked },
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
      void (currentHasLiked
        ? unlikePost.mutateAsync({ postId })
        : likePost.mutateAsync({ postId }));
      clickCount.current = 0;
      isLikingRef.current = false;
    }, 5000),
  );

  const likePost = api.postInteraction.likePost.useMutation({
    onMutate: async (newHasLikedData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.postInteraction.hasLiked.cancel();

      // Get the data from the query cache
      const prevData = utils.postInteraction.hasLiked.getData({
        postId: newHasLikedData.postId,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.postInteraction.hasLiked.setData({ postId: newHasLikedData.postId }, true);

      // Return the previous data so we can revert if something goes wrong
      return { prevData };
    },
    onError: async (_err, newHasLikedData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.postInteraction.hasLiked.setData(
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
      await utils.postInteraction.hasLiked.invalidate();
    },
  });

  const unlikePost = api.postInteraction.unlikePost.useMutation({
    onMutate: async (newHasLikedData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.postInteraction.hasLiked.cancel();

      // Get the data from the query cache
      const prevData = utils.postInteraction.hasLiked.getData({
        postId: newHasLikedData.postId,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.postInteraction.hasLiked.setData({ postId: newHasLikedData.postId }, false);

      // Return the previous data so we can revert if something goes wrong
      return { prevData };
    },
    onError: async (_err, newHasLikedData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.postInteraction.hasLiked.setData(
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
      await utils.postInteraction.hasLiked.invalidate();
    },
  });

  const handleLikePressed = async () => {
    isLikingRef.current = true;

    // Optimistically update the UI
    await utils.postInteraction.hasLiked.cancel();
    utils.postInteraction.hasLiked.setData({ postId }, !hasLiked);
    await changeLikeCount({
      postId,
      changeCountBy: hasLiked ? -1 : 1,
      endpoint,
      userId,
    }); // Use the passed in endpoint

    // Call the throttled function
    clickCount.current++;
    throttledLikeRequest.current(hasLiked);
  };

  const handleLikeDoubleTapped = async () => {
    if (!hasLiked) {
      await utils.postInteraction.hasLiked.cancel();
      utils.postInteraction.hasLiked.setData({ postId }, !hasLiked);
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
