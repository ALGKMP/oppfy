import { z } from "zod";

import { schema } from "@oppfy/db";

import { createTRPCRouter, protectedProcedure } from "../../../trpc";

export const reportRouter = createTRPCRouter({
  reportUser: protectedProcedure
    .input(
      z.object({
        reportedUserId: z.string(),
        reason: z.enum(schema.reportUserReasonEnum.enumValues),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.services.report.reportUser({
        userId: ctx.session.uid,
        reason: input.reason,
        reportedUserId: input.reportedUserId,
      });
    }),

  reportPost: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        reason: z.enum(schema.reportPostReasonEnum.enumValues),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.services.report.reportPost({
        userId: ctx.session.uid,
        reason: input.reason,
        reportedPostId: input.postId,
      });
    }),

  reportComment: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        reason: z.enum(schema.reportCommentReasonEnum.enumValues),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.services.report.reportComment({
        userId: ctx.session.uid,
        reason: input.reason,
        reportedCommentId: input.commentId,
      });
    }),
});
