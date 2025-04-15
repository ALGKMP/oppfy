import { useRef } from "react";
import { useToastController } from "@tamagui/toast";
import type { ReportPostReason } from "node_modules/@oppfy/api/src/models";

import { api } from "~/utils/api";
import { useThrottleWithIncreaseDelay } from "./useThrottleWithIncreaseDelay";

interface PostStats {
  likes: number;
  comments: number;
  hasLiked: boolean;
}

interface InteractWithPostProps {
  postId: string;
  initialPostStats: PostStats;
}

export const usePostInteractions = ({
  postId,
  initialPostStats,
}: InteractWithPostProps) => {
  const toast = useToastController();
  const utils = api.useUtils();
  const { data: postStats } = api.post.getPostStats.useQuery(
    { postId },
    { initialData: initialPostStats },
  );

  const clickCount = useRef(0);
  const isLikingRef = useRef(false);

  const {
    data: comments,
    isLoading: isLoadingComments,
    hasNextPage: commentsHasNextPage,
    isFetchingNextPage: commentsIsFetchingNextPage,
    fetchNextPage: fetchNextCommentsPage,
  } = api.post.paginateComments.useInfiniteQuery(
    { postId, pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const throttledLikeRequest = useRef(
    useThrottleWithIncreaseDelay(async (currentHasLiked: boolean) => {
      if (clickCount.current % 2 === 0) {
        clickCount.current = 0;
        return;
      }
      void (currentHasLiked
        ? await unlikePostMutation.mutateAsync({ postId })
        : await likePostMutation.mutateAsync({ postId }));
      clickCount.current = 0;
      isLikingRef.current = false;
    }, 5000),
  );

  const likePostMutation = api.postInteraction.likePost.useMutation({
    onMutate: async (newHasLikedData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.getPostStats.cancel();

      // Get the data from the query cache
      const prevData = utils.post.getPostStats.getData({
        postId: newHasLikedData.postId,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.post.getPostStats.setData(
        { postId: newHasLikedData.postId },
        {
          ...prevData,
          likes: prevData.likes + 1,
          hasLiked: true,
        },
      );

      // Return the previous data so we can revert if something goes wrong
      return { prevData };
    },
    onError: async (_err, newHasLikedData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.post.getPostStats.setData(
        { postId: newHasLikedData.postId },
        ctx.prevData,
      );
      await utils.post.getPostStats.invalidate({ postId });
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.post.getPostStats.invalidate({ postId });
    },
  });

  const unlikePostMutation = api.postInteraction.unlikePost.useMutation({
    onMutate: async (newHasLikedData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.getPostStats.cancel();

      // Get the data from the query cache
      const prevData = utils.post.getPostStats.getData({
        postId: newHasLikedData.postId,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.post.getPostStats.setData(
        { postId: newHasLikedData.postId },
        {
          ...prevData,
          likes: prevData.likes - 1,
          hasLiked: false,
        },
      );

      // Return the previous data so we can revert if something goes wrong
      return { prevData };
    },
    onError: async (_err, newHasLikedData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, use the context-value from onMutate
      utils.post.getPostStats.setData(
        { postId: newHasLikedData.postId },
        ctx.prevData,
      );
      await utils.post.getPostStats.invalidate({ postId });
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.post.getPostStats.invalidate({ postId });
    },
  });

  const createCommentMutation = api.postInteraction.createComment.useMutation({
    onMutate: async (newCommentData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.paginateComments.cancel({
        postId: newCommentData.postId,
        pageSize: 10,
      });

      await utils.post.getPostStats.cancel();

      // Get the data from the query cache
      const prevPaginateCommentsData =
        utils.post.paginateComments.getInfiniteData({
          postId: newCommentData.postId,
          pageSize: 10,
        });
      const prevPostStatsData = utils.post.getPostStats.getData({
        postId: newCommentData.postId,
      });

      if (
        prevPaginateCommentsData === undefined ||
        prevPostStatsData === undefined
      )
        return;

      const currentUser = utils.profile.getProfile.getData();
      if (currentUser === undefined) return;

      // Optimistically update the data
      utils.post.paginateComments.setInfiniteData(
        { postId: newCommentData.postId, pageSize: 10 },
        {
          ...prevPaginateCommentsData,
          pages: prevPaginateCommentsData.pages.map((page) => ({
            ...page,
            items: [
              {
                comment: {
                  id: new Date().getTime().toString(),
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  userId: currentUser?.userId,
                  postId: newCommentData.postId,
                  body: newCommentData.body,
                },
                authorUserId: currentUser?.userId,
                authorUsername: currentUser?.username,
                authorName: currentUser?.name,
                authorProfilePictureUrl: currentUser?.profilePictureUrl,
              },
              ...page.items,
            ],
          })),
        },
      );

      // Optimistically update the data
      utils.post.getPostStats.setData(
        { postId: newCommentData.postId },
        {
          ...prevPostStatsData,
          comments: prevPostStatsData.comments + 1,
        },
      );

      return { prevPaginateCommentsData, prevPostStatsData };
    },
    onError: async (_err, newCommentData, ctx) => {
      if (ctx === undefined) return;

      utils.post.paginateComments.setInfiniteData(
        { postId: newCommentData.postId },
        ctx.prevPaginateCommentsData,
      );
      utils.post.getPostStats.setData(
        { postId: newCommentData.postId },
        ctx.prevPostStatsData,
      );
      await utils.post.paginateComments.invalidate();
    },
    onSettled: async () => {
      await utils.post.paginateComments.invalidate();
      await utils.post.getPostStats.invalidate({ postId });
    },
  });

  const deleteCommentMutation = api.postInteraction.deleteComment.useMutation({
    onMutate: async (newCommentData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.paginateComments.cancel({
        postId: newCommentData.postId,
        pageSize: 10,
      });

      await utils.post.getPostStats.cancel();

      // Get the data from the query cache
      const prevPaginateCommentsData =
        utils.post.paginateComments.getInfiniteData({
          postId: newCommentData.postId,
          pageSize: 10,
        });

      const prevPostStatsData = utils.post.getPostStats.getData({
        postId: newCommentData.postId,
      });

      if (
        prevPaginateCommentsData === undefined ||
        prevPostStatsData === undefined
      )
        return;

      // Optimistically update the data
      utils.post.paginateComments.setInfiniteData(
        { postId: newCommentData.postId, pageSize: 10 },
        {
          ...prevPaginateCommentsData,
          pages: prevPaginateCommentsData.pages.map((page) => ({
            ...page,
            items: page.items.filter(
              (comment) => comment.comment.id !== newCommentData.commentId,
            ),
          })),
        },
      );

      // Optimistically update the post stats
      utils.post.getPostStats.setData(
        { postId: newCommentData.postId },
        {
          ...prevPostStatsData,
          comments: prevPostStatsData.comments - 1,
        },
      );

      return { prevPaginateCommentsData, prevPostStatsData };
    },
    onError: async (_err, newCommentData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, revert to the previous data
      utils.post.paginateComments.setInfiniteData(
        { postId: newCommentData.postId, pageSize: 10 },
        ctx.prevPaginateCommentsData,
      );

      utils.post.getPostStats.setData(
        { postId: newCommentData.postId },
        ctx.prevPostStatsData,
      );

      await utils.post.paginateComments.invalidate();
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.post.paginateComments.invalidate();
      await utils.post.getPostStats.invalidate({ postId });
    },
  });

  const loadMoreComments = async () => {
    if (commentsHasNextPage && !commentsIsFetchingNextPage) {
      await fetchNextCommentsPage();
    }
  };

  const postComment = async (body: string) => {
    await createCommentMutation.mutateAsync({ postId, body });
  };

  const deleteComment = async (commentId: string) => {
    await deleteCommentMutation.mutateAsync({ postId, commentId });
  };

  const handleLikePressed = async () => {
    isLikingRef.current = true;

    // Optimistically update the UI
    await utils.post.getPostStats.cancel();
    utils.post.getPostStats.setData(
      { postId },
      {
        ...postStats,
        likes: postStats.likes + (postStats.hasLiked ? -1 : 1),
        hasLiked: !postStats.hasLiked,
      },
    );
    await utils.post.getPostStats.invalidate({ postId });

    // Call the throttled function
    clickCount.current++;
    throttledLikeRequest.current(postStats.hasLiked);
  };

  const handleLikeDoubleTapped = async () => {
    if (!postStats.hasLiked) {
      await utils.post.getPostStats.cancel();
      utils.post.getPostStats.setData(
        { postId },
        {
          ...postStats,
          likes: postStats.likes + 1,
          hasLiked: true,
        },
      );
      await utils.post.getPostStats.invalidate({ postId });
      clickCount.current++;
      throttledLikeRequest.current(postStats.hasLiked);
    }
  };

  return {
    postStats,
    handleLikePressed,
    handleLikeDoubleTapped,
    comments,
    isLoadingComments,
    loadMoreComments,
    postComment,
    deleteComment,
  };
};
