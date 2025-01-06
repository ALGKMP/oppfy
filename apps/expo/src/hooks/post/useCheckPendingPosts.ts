import { useCallback } from "react";
import { useRouter } from "expo-router";

import { api } from "~/utils/api";

export const useCheckPendingPosts = () => {
  const router = useRouter();
  const { data: user } = api.auth.getSession.useQuery();

  const checkAndNavigate = useCallback(async () => {
    if (!user) return;

    // Get the user's pending posts status
    const { data: pendingPosts } =
      await api.pendingUser.getPendingPosts.fetch();

    if (pendingPosts && pendingPosts.length > 0) {
      // Navigate to the review screen if there are pending posts
      router.push("/(app)/(review)/pending-posts");
      return true;
    }

    return false;
  }, [router, user]);

  return {
    checkAndNavigate,
  };
};
