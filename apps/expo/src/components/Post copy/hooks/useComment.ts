import { useRef } from "react";
import { randomUUID } from "expo-crypto";
import { useToastController } from "@tamagui/toast";
import type { ReportPostReason } from "node_modules/@oppfy/api/src/models";

import { api, RouterOutputs } from "~/utils/api";

type Profile = RouterOutputs["profile"]["getProfile"];
type OnboardedProfile =
  RouterOutputs["post"]["paginateComments"]["items"][number]["profile"];

interface UseCommentParams {
  postId: string;
}

const PAGE_SIZE = 10;

const useComment = ({ postId }: UseCommentParams) => {
  const utils = api.useUtils();

  const createCommentMutation = api.postInteraction.createComment.useMutation({
    onMutate: async (newCommentData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.getPostStats.cancel({ postId });
      await utils.post.paginateComments.cancel({
        postId: newCommentData.postId,
        pageSize: PAGE_SIZE,
      });

      // Get the data from the query cache
      const profile = utils.profile.getProfile.getData({});
      const prevPostStatsData = utils.post.getPostStats.getData({
        postId: newCommentData.postId,
      });
      const prevPaginateCommentsData =
        utils.post.paginateComments.getInfiniteData({
          postId: newCommentData.postId,
          pageSize: PAGE_SIZE,
        });

      if (profile === undefined) return;
      if (prevPostStatsData === undefined) return;
      if (prevPaginateCommentsData === undefined) return;

      // Optimistically update the data
      utils.post.getPostStats.setData(
        { postId: newCommentData.postId },
        {
          ...prevPostStatsData,
          comments: prevPostStatsData.comments + 1,
        },
      );
      utils.post.paginateComments.setInfiniteData(
        { postId: newCommentData.postId, pageSize: PAGE_SIZE },
        {
          ...prevPaginateCommentsData,
          pages: prevPaginateCommentsData.pages.map((page) => ({
            ...page,
            items: [
              {
                comment: {
                  id: randomUUID(),
                  userId: profile?.userId,
                  postId: newCommentData.postId,
                  body: newCommentData.body,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
                // we know that we are onboarded if we are able to comment
                profile: profile as OnboardedProfile,
              },
              ...page.items,
            ],
          })),
        },
      );

      return { prevPaginateCommentsData, prevPostStatsData };
    },
    onError: async (_err, newCommentData, ctx) => {
      if (ctx === undefined) return;

      utils.post.getPostStats.setData(
        { postId: newCommentData.postId },
        ctx.prevPostStatsData,
      );
      utils.post.paginateComments.setInfiniteData(
        { postId: newCommentData.postId, pageSize: PAGE_SIZE },
        ctx.prevPaginateCommentsData,
      );

      await utils.post.paginateComments.invalidate({
        postId: newCommentData.postId,
        pageSize: PAGE_SIZE,
      });
    },
    onSettled: () => {
      void utils.post.paginateComments.invalidate({ pageSize: PAGE_SIZE });
    },
  });

  const deleteCommentMutation = api.postInteraction.deleteComment.useMutation({
    onMutate: async (newCommentData) => {
      // Cancel outgoing fetches (so they don't overwrite our optimistic update)
      await utils.post.getPostStats.cancel({ postId });
      await utils.post.paginateComments.cancel({
        postId: newCommentData.postId,
        pageSize: PAGE_SIZE,
      });

      // Get the data from the query cache
      const profile = utils.profile.getProfile.getData({});
      const prevPostStatsData = utils.post.getPostStats.getData({
        postId: newCommentData.postId,
      });
      const prevPaginateCommentsData =
        utils.post.paginateComments.getInfiniteData({
          postId: newCommentData.postId,
          pageSize: PAGE_SIZE,
        });

      if (profile === undefined) return;
      if (prevPostStatsData === undefined) return;
      if (prevPaginateCommentsData === undefined) return;

      // Optimistically update the data
      utils.post.getPostStats.setData(
        { postId: newCommentData.postId },
        {
          ...prevPostStatsData,
          comments: prevPostStatsData.comments - 1,
        },
      );
      utils.post.paginateComments.setInfiniteData(
        { postId: newCommentData.postId, pageSize: PAGE_SIZE },
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
    onSettled: () => {
      void utils.post.paginateComments.invalidate({ pageSize: PAGE_SIZE });
    },
  });

  const createComment = async (body: string) => {
    await createCommentMutation.mutateAsync({ postId, body });
  };

  const deleteComment = async (commentId: string) => {
    await deleteCommentMutation.mutateAsync({ postId, commentId });
  };

  return {
    createComment,
    deleteComment,
  };
};

export { useComment };
