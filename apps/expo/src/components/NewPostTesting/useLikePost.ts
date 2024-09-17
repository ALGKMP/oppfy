import { useCallback, useRef } from "react";
import throttle from "lodash/throttle"; // Change debounce to throttle

import { api } from "~/utils/api";
import { useOptimisticUpdatePost } from "./useOptimicUpdatePost";

interface LikePostProps {
  postId: string;
  endpoint: "self-profile" | "other-profile" | "home-feed" | "single-post";
  userId?: string;
}

export const useLikePost = ({postId, endpoint, userId}: LikePostProps) => {
  const utils = api.useUtils();
  const { data: hasLiked } = api.post.hasliked.useQuery(
    { postId },
    { initialData: false },
  );
  const { changeLikeCount, invalidatePost } = useOptimisticUpdatePost()

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
      await invalidatePost({endpoint, postId, userId});
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
      await invalidatePost({endpoint, postId});
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.post.hasliked.invalidate();
    },
  });


  const throttledRef = useRef<((currentHasLiked: boolean) => void) | null>(
    null,
  );
  const clickCount = useRef(0);

  // Initialize the throttled function only once
  if (!throttledRef.current) {
    clickCount.current = 0;
    throttledRef.current = throttle(
      (currentHasLiked: boolean) => {
        (async () => {
          if (clickCount.current % 2 === 0) return;
          currentHasLiked
            ? await unlikePost.mutateAsync({ postId })
            : await likePost.mutateAsync({ postId });
          await invalidatePost({endpoint, postId});
        })().catch((error) => {
          console.error("Error in throttledLikeRequest:", error);
        });
      },
      5000,
      { leading: false, trailing: true },
    );
  }

  const handleLikePressed = useCallback(async () => {
    // Optimistically update the UI
    utils.post.hasliked.setData({ postId }, !hasLiked);
    await changeLikeCount({postId, changeCountBy: hasLiked ? -1 : 1, endpoint, userId}) // Use the passed in endpoint

    // Call the throttled function
    if (throttledRef.current) {
      clickCount.current++;
      throttledRef.current(hasLiked);
    }
  }, [hasLiked, postId, utils.post.hasliked, changeLikeCount, endpoint, userId]); // Add endpoint to dependencies

  const handleLikeDoubleTapped = async () => {
    if (hasLiked) return;
    await changeLikeCount({postId, changeCountBy: 1, endpoint, userId}) // Use the passed in endpoint
    await likePost.mutateAsync({ postId });
  };

  return { hasLiked, handleLikePressed, handleLikeDoubleTapped };
};
