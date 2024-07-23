import { useState, useCallback, useEffect } from 'react';
import { useSession } from "~/contexts/SessionContext";
import { api } from "~/utils/api";

const DEBOUNCE_DELAY = 5000; // 5 seconds

const useView = () => {
  const [viewedItems, setViewedItems] = useState<{ type: 'post' | 'profile', id: number }[]>([]);
  const { getCurrentUserProfileId } = useSession();

  const viewMultiplePostsMutation = api.post.viewMultiplePosts.useMutation();
  const viewMultipleProfilesMutation = api.profile.viewMultipleProfiles.useMutation();

  const addViewedItem = useCallback((type: 'post' | 'profile', id: number) => {
    setViewedItems(prev => [...prev, { type, id }]);
  }, []);

  const sendViewedData = useCallback(() => {
    const posts = viewedItems.filter(item => item.type === 'post').map(item => item.id);
    const profiles = viewedItems.filter(item => item.type === 'profile').map(item => item.id);

    if (posts.length > 0) {
      viewMultiplePostsMutation.mutate({ postIds: posts });
    }

    if (profiles.length > 0) {
      viewMultipleProfilesMutation.mutate({ profileIds: profiles });
    }

    setViewedItems([]);
  }, [viewedItems, viewMultiplePostsMutation, viewMultipleProfilesMutation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (viewedItems.length > 0) {
        sendViewedData();
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [viewedItems, sendViewedData]);

  const viewPost = useCallback((postId: number) => {
    addViewedItem('post', postId);
  }, [addViewedItem]);

  const viewProfile = useCallback((profileId: number) => {
    addViewedItem('profile', profileId);
  }, [addViewedItem]);

  return { viewPost, viewProfile };
};

export default useView;