import { useRouter } from "expo-router";
import { useToastController } from "@tamagui/toast";

import { api } from "~/utils/api";
import { useOptimisticUpdatePost } from "./useOptimicUpdatePost";

interface UseCommentsProps {
  postId: string;
  endpoint: "self-profile" | "other-profile" | "single-post" | "home-feed";
  userId?: string;
}

export const useComments = ({postId, endpoint, userId}: UseCommentsProps) => {
  const router = useRouter();
  const toast = useToastController();
  const utils = api.useUtils();
  const {changeCommentCount, invalidatePost} = useOptimisticUpdatePost()
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

  const postComment = api.post.createComment.useMutation({
    onMutate: async (newCommentData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      changeCommentCount({
        endpoint,
        changeCountBy: 1,
        postId: newCommentData.postId,
      });
      await utils.post.paginateComments.cancel({
        postId: newCommentData.postId,
        pageSize: 10,
      });

      // Get the data from the query cache
      const prevData = utils.post.paginateComments.getInfiniteData({
        postId: newCommentData.postId,
        pageSize: 10,
      });
      if (prevData === undefined) return;

      const currentUser = utils.profile.getFullProfileSelf.getData();

      // Optimistically update the data
      utils.post.paginateComments.setInfiniteData(
        { postId: newCommentData.postId, pageSize: 10 },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: [
              {
                postId: newCommentData.postId,
                commentId: new Date().getTime().toString(),
                body: newCommentData.body,
                userId: currentUser?.userId ?? "",
                username: currentUser?.username ?? "",
                profilePictureUrl: currentUser?.profilePictureUrl ?? "",
                createdAt: new Date(),
              },
              ...page.items,
            ],
          })),
        },
      );

      return { prevData };
    },
    onError: async (_err, newCommentData, ctx) => {
      if (ctx === undefined) return;

      utils.post.paginateComments.setInfiniteData(
        { postId: newCommentData.postId },
        ctx.prevData,
      );
      await invalidatePost({endpoint, postId, userId});
    },
    onSettled: async () => {
      await utils.post.paginateComments.invalidate();
    },
  });

  const deleteComment = api.post.deleteComment.useMutation({
    onMutate: async (newCommentData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.paginateComments.cancel({ postId, pageSize: 10 });

      // Get the data from the query cache
      const prevData = utils.post.paginateComments.getInfiniteData({
        postId,
        pageSize: 10,
      });
      if (prevData === undefined) return;

      // Optimistically update the data
      utils.post.paginateComments.setInfiniteData(
        { postId, pageSize: 10 },
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.filter(
              (comment) => comment.commentId !== newCommentData.commentId,
            ),
          })),
        },
      );

      return { prevData };
    },
    onError: async (_err, _newCommentData, ctx) => {
      if (ctx === undefined) return;

      // If the mutation fails, revert to the previous data
      utils.post.paginateComments.setInfiniteData(
        { postId, pageSize: 10 },
        ctx.prevData,
      );
      await invalidatePost({endpoint, postId, userId});
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.post.paginateComments.invalidate();
    },
  });

  const reportComment = api.report.reportComment.useMutation();

  const handleLoadMoreComments = async () => {
    if (commentsHasNextPage && !commentsIsFetchingNextPage) {
      await fetchNextCommentsPage();
    }
  };

  const handlePostComment = async (body: string) => {
    await postComment.mutateAsync({ postId, body });
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment.mutateAsync({ postId, commentId });
  };

  const handleReportComment = async (commentId: string) => {
    await reportComment.mutateAsync({ commentId, reason: "Other" });
    toast.show("Comment Reported");
  };

  const handlePressProfilePicture = (userId: string, username: string) => {
    router.push({
      pathname: `/profile/[userId]`,
      params: { userId, username },
    });
  };

  const handlePressUsername = (userId: string, username: string) => {
    router.push({
      pathname: `/profile/[userId]`,
      params: { userId, username },
    });
  };

  const commentItems =
    comments?.pages
      .flatMap((page) => page.items)
      .map((comment) => ({
        userId: comment.userId,
        id: comment.commentId,
        body: comment.body,
        username: comment.username ?? "",
        profilePictureUrl: comment.profilePictureUrl,
        createdAt: comment.createdAt,
      })) ?? [];

  return {
    commentItems,
    isLoadingComments,
    handleLoadMoreComments,
    handlePostComment,
    handleDeleteComment,
    handleReportComment,
    handlePressProfilePicture,
    handlePressUsername,
  };
};
