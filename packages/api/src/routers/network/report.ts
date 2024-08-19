import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { sharedValidators, trpcValidators } from "@oppfy/validators";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const reportRouter = createTRPCRouter({
  reportUser: protectedProcedure
    .input(
      z.object({
        targetUserId: z.string(),
        reason: sharedValidators.report.reportUserOptions,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { targetUserId, reason } = input;
        return await ctx.services.report.reportUser({
          targetUserId,
          reason,
          reporterUserId: ctx.session.uid,
        });
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to report user",
        });
      }
    }),

  reportPost: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        reason: sharedValidators.report.reportPostOptions,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { postId, reason } = input;
        return await ctx.services.report.reportPost({
          postId,
          reason,
          reporterUserId: ctx.session.uid,
        });
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to report post",
        });
      }
    }),

  reportComment: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        reason: sharedValidators.report.reportCommentOptions,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { commentId, reason } = input;
        return await ctx.services.report.reportComment({
          commentId,
          reason,
          reporterUserId: ctx.session.uid,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to report comment",
        });
      }
    }),
});
