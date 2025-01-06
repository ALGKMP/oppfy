import { useCallback, useState } from "react";

import { api } from "~/utils/api";

export const useReviewPendingPosts = () => {
  const [isReviewing, setIsReviewing] = useState(false);
  const utils = api.useUtils();

  const { data: pendingPosts, isLoading: isLoadingPendingPosts } =
    api.pendingUser.getPendingPostsByPhoneNumber.useQuery(
      {
        phoneNumber: "", // This will be set when calling reviewPendingPosts
      },
      {
        enabled: false, // Don't fetch automatically
      },
    );

  const { mutateAsync: migratePendingPosts } =
    api.pendingUser.migratePendingPosts.useMutation({
      onSuccess: () => {
        // Invalidate relevant queries after migration
        void utils.post.invalidate();
        void utils.pendingUser.invalidate();
      },
    });

  const reviewPendingPosts = useCallback(
    async (phoneNumber: string) => {
      setIsReviewing(true);
      try {
        // Fetch pending posts for the phone number
        const posts =
          await utils.pendingUser.getPendingPostsByPhoneNumber.fetch({
            phoneNumber,
          });

        if (posts.length === 0) {
          return {
            hadPendingPosts: false,
            migratedCount: 0,
          };
        }

        // Get the pendingUserId from the first post
        const pendingUserId = posts[0].pendingUserId;

        // Migrate the posts
        await migratePendingPosts({
          pendingUserId,
        });

        return {
          hadPendingPosts: true,
          migratedCount: posts.length,
          posts,
        };
      } catch (error) {
        console.error("Error reviewing pending posts:", error);
        throw error;
      } finally {
        setIsReviewing(false);
      }
    },
    [migratePendingPosts, utils.pendingUser.getPendingPostsByPhoneNumber],
  );

  return {
    reviewPendingPosts,
    isReviewing,
    pendingPosts,
    isLoadingPendingPosts,
  };
};
