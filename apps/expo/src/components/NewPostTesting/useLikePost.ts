import { useCallback, useRef } from "react";
import throttle from "lodash/throttle"; // Change debounce to throttle

import { api } from "~/utils/api";

export const useLikePost = (postId: string) => {
  const utils = api.useUtils();
  const { data: hasLiked } = api.post.hasliked.useQuery(
    { postId },
    { initialData: false },
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
    onError: (_err, newHasLikedData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.post.hasliked.setData(
        { postId: newHasLikedData.postId },
        ctx.prevData,
      );
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
    onError: (_err, newHasLikedData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.post.hasliked.setData(
        { postId: newHasLikedData.postId },
        ctx.prevData,
      );
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.post.hasliked.invalidate();
    },
  });

  // const handleLikePressed = async () => {
  // Optimistically update the cache
  // if (hasLiked) {
  //   utils.post.hasliked.setData({ postId }, false);
  // } else {
  //   utils.post.hasliked.setData({ postId }, true);
  // }

  // Throttled function to send the actual request
  // await throttledLikeRequest(hasLiked);
  // };

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
        })().catch((error) => {
          console.error("Error in throttledLikeRequest:", error);
        });
      },
      5000,
      { leading: false, trailing: true },
    );
  }

  const handleLikePressed = useCallback(() => {
    // Optimistically update the UI
    utils.post.hasliked.setData({ postId }, !hasLiked);

    // Call the throttled function
    if (throttledRef.current) {
      clickCount.current++;
      throttledRef.current(hasLiked);
    }
  }, [hasLiked, postId, utils.post.hasliked]);

  const handleLikeDoubleTapped = async () => {
    if (hasLiked) return;
    await likePost.mutateAsync({ postId });
  };

  return { hasLiked, handleLikePressed, handleLikeDoubleTapped };
};
