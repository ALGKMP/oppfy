import { useCallback } from "react";

import { api } from "~/utils/api";

export const usePendingPosts = () => {
  const { data: session } = api.auth.getSession.useQuery();
  const utils = api.useUtils();

  const { mutateAsync: migratePendingPosts } =
    api.pendingUser.migratePendingPosts.useMutation({
      onSuccess: () => {
        // Invalidate relevant queries after migration
        void utils.post.invalidate();
        void utils.pendingUser.invalidate();
      },
    });

  const checkAndMigratePendingPosts = useCallback(
    async (phoneNumber: string) => {
      try {
        // First check if there are any pending posts
        const pendingPosts =
          await utils.pendingUser.getPendingPostsByPhoneNumber.fetch({
            phoneNumber,
          });

        if (pendingPosts.length > 0) {
          // We found pending posts, get the pendingUserId from the first post
          const pendingUserId = pendingPosts[0].pendingUserId;

          // Migrate the posts to the new user
          await migratePendingPosts({
            pendingUserId,
          });

          return {
            hadPendingPosts: true,
            migratedCount: pendingPosts.length,
          };
        }

        return {
          hadPendingPosts: false,
          migratedCount: 0,
        };
      } catch (error) {
        console.error("Error checking/migrating pending posts:", error);
        throw error;
      }
    },
    [migratePendingPosts, utils.pendingUser.getPendingPostsByPhoneNumber],
  );

  return {
    checkAndMigratePendingPosts,
  };
};
