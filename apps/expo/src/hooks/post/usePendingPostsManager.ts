import { useCallback } from "react";

import { api } from "~/utils/api";

export const usePendingPostsManager = () => {
  const utils = api.useUtils();

  const { data: pendingPosts, isLoading: isLoadingPosts } =
    api.pendingUser.getPendingPosts.useQuery();

  const { mutateAsync: updateStatus } =
    api.pendingUser.updatePendingPostsStatus.useMutation({
      onSuccess: () => {
        void utils.pendingUser.getPendingPosts.invalidate();
      },
    });

  const { mutateAsync: migratePosts } =
    api.pendingUser.migratePendingPosts.useMutation({
      onSuccess: () => {
        void utils.pendingUser.getPendingPosts.invalidate();
        void utils.post.invalidate();
      },
    });

  const acceptPosts = useCallback(
    async (pendingUserId: string) => {
      try {
        await migratePosts({ pendingUserId });
        return true;
      } catch (error) {
        console.error("Error accepting posts:", error);
        return false;
      }
    },
    [migratePosts],
  );

  const skipPosts = useCallback(
    async (pendingUserId: string) => {
      try {
        // Just mark the user as not having pending posts without migrating them
        await updateStatus({ postCount: 0 });
        return true;
      } catch (error) {
        console.error("Error skipping posts:", error);
        return false;
      }
    },
    [updateStatus],
  );

  return {
    pendingPosts,
    isLoadingPosts,
    acceptPosts,
    skipPosts,
  };
};
