import { useCallback, useRef } from "react";
import { api } from "~/utils/api";

const useThrottleWithIncreaseDelay = (
  fn: (...args: any[]) => void | Promise<void>,
  initialDelay: number,
) => {
  const lastRun = useRef(0);
  const currentDelay = useRef(initialDelay);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const throttledFunction = useCallback(
    (...args: any[]) => {
      const now = Date.now();

      const execute = () => {
        lastRun.current = now;
        fn(...args);
        currentDelay.current = initialDelay; // Reset delay after execution
        if (timeoutId.current) {
          clearTimeout(timeoutId.current); // Clear the timeout
          timeoutId.current = null;
        }
      };

      if (timeoutId.current) {
        clearTimeout(timeoutId.current); // Clear the existing timeout
      }

      timeoutId.current = setTimeout(() => {
        execute();
      }, currentDelay.current);

      currentDelay.current = initialDelay; // Reset delay after setting the timeout
    },
    [fn, initialDelay],
  );

  return throttledFunction;
};

interface UseLikeParams {
  postId: string;
}

const useLike = ({ postId }: UseLikeParams) => {
  const utils = api.useUtils();
  const clickCount = useRef(0);
  const isProcessingRef = useRef(false);

  const likePostMutation = api.postInteraction.likePost.useMutation({
    onError: async (_err, newData) => {
      // If the mutation fails, invalidate to sync with server
      await utils.post.getPostStats.invalidate({ postId: newData.postId });
      await utils.post.getIsLiked.invalidate({ postId: newData.postId });
    },
  });

  const unlikePostMutation = api.postInteraction.unlikePost.useMutation({
    onError: async (_err, newData) => {
      // If the mutation fails, invalidate to sync with server
      await utils.post.getPostStats.invalidate({ postId: newData.postId });
      await utils.post.getIsLiked.invalidate({ postId: newData.postId });
    },
  });

  // Throttled function that handles the actual server call
  const throttledServerRequest = useRef(
    useThrottleWithIncreaseDelay(async (shouldBeLiked: boolean) => {
      // If click count is even, user ended up where they started, so no server call needed
      if (clickCount.current % 2 === 0) {
        clickCount.current = 0;
        isProcessingRef.current = false;
        return;
      }

      try {
        if (shouldBeLiked) {
          await likePostMutation.mutateAsync({ postId });
        } else {
          await unlikePostMutation.mutateAsync({ postId });
        }
      } finally {
        clickCount.current = 0;
        isProcessingRef.current = false;
      }
    }, 3000),
  );

  // Generic function to update UI optimistically
  const updateUIOptimistically = async (newIsLiked: boolean) => {
    // Cancel outgoing fetches (so they don't overwrite our optimistic update)
    await utils.post.getIsLiked.cancel();
    await utils.post.getPostStats.cancel();

    // Get the current data from cache
    const currentPostStats = utils.post.getPostStats.getData({ postId });
    if (currentPostStats === undefined) return false;

    // Optimistically update the UI immediately
    utils.post.getIsLiked.setData({ postId }, newIsLiked);
    utils.post.getPostStats.setData(
      { postId },
      {
        ...currentPostStats,
        likes: currentPostStats.likes + (newIsLiked ? 1 : -1),
      },
    );

    return true;
  };

  // Function to like a post (only likes if not already liked)
  const likePost = async () => {
    const currentIsLiked = utils.post.getIsLiked.getData({ postId });
    if (currentIsLiked === true) return; // Already liked, do nothing

    const success = await updateUIOptimistically(true);
    if (!success) return;

    isProcessingRef.current = true;
    clickCount.current++;
    throttledServerRequest.current(true);
  };

  // Function to unlike a post (only unlikes if currently liked)
  const unlikePost = async () => {
    const currentIsLiked = utils.post.getIsLiked.getData({ postId });
    if (currentIsLiked === false) return; // Already unliked, do nothing

    const success = await updateUIOptimistically(false);
    if (!success) return;

    isProcessingRef.current = true;
    clickCount.current++;
    throttledServerRequest.current(false);
  };

  // Function to toggle like state (for like button)
  const handleLikeToggle = async () => {
    const currentIsLiked = utils.post.getIsLiked.getData({ postId });
    if (currentIsLiked === undefined) return;

    const newIsLiked = !currentIsLiked;
    const success = await updateUIOptimistically(newIsLiked);
    if (!success) return;

    isProcessingRef.current = true;
    clickCount.current++;
    throttledServerRequest.current(newIsLiked);
  };

  return {
    likePost,
    unlikePost,
    handleLikeToggle,
  };
};

export { useLike };
