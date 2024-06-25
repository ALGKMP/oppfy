import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { sharedValidators, trpcValidators } from "@oppfy/validators";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const reportRouter = createTRPCRouter({
  reportUser: protectedProcedure
    .input(trpcValidators.input.report.reportUser)
    .mutation(async ({ ctx, input }) => {
      try {
        const { targetUserId, reason } = input;
        return await ctx.services.report.reportUser({
          targetUserId,
          reason,
          reporterUserId: ctx.session.user.id,
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
    .input(trpcValidators.input.report.reportPost)
    .mutation(async ({ ctx, input }) => {
      try {
        const { postId, reason } = input;
        return await ctx.services.report.reportPost({
          postId,
          reason,
          reporterUserId: ctx.session.user.id,
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
    .input(trpcValidators.input.report.reportComment)
    .mutation(async ({ ctx, input }) => {
      try {
        const { commentId, reason } = input;
        return await ctx.services.report.reportComment({
          commentId,
          reason,
          reporterUserId: ctx.session.user.id,
        });
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to report comment",
        });
      }
    }),
});
