import { useCallback, useEffect, useState } from "react";

import { useSession } from "~/contexts/SessionContext";
import { api } from "~/utils/api";

const DEBOUNCE_DELAY = 10000; // 5 seconds

const useView = () => {
  const [viewedItems, setViewedItems] = useState<
    { type: "post" | "profile"; id: string }[]
  >([]);

  const viewMultiplePostsMutation = api.post.viewMultiplePosts.useMutation();

  const addViewedItem = useCallback((type: "post" | "profile", id: string) => {
    setViewedItems((prev) => [...prev, { type, id }]);
  }, []);

  const sendViewedData = useCallback(() => {
    const posts = viewedItems
      .filter((item) => item.type === "post")
      .map((item) => item.id);

    if (posts.length > 0) {
      viewMultiplePostsMutation.mutate({ postIds: posts });
    }
    setViewedItems([]);
  }, [viewedItems, viewMultiplePostsMutation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (viewedItems.length > 0) {
        sendViewedData();
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [viewedItems, sendViewedData]);

  const viewPost = useCallback(
    (postId: string) => {
      addViewedItem("post", postId);
    },
    [addViewedItem],
  );

  const viewProfile = useCallback(
    (profileId: string) => {
      addViewedItem("profile", profileId);
    },
    [addViewedItem],
  );

  return { viewPost, viewProfile };
};

export default useView;
