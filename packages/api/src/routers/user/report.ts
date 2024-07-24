import { TRPCError } from "@trpc/server";
import { trpcValidators } from "@oppfy/validators";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const reportRouter = createTRPCRouter({
  reportPost: protectedProcedure
    .input(trpcValidators.input.report.reportPost)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.report.reportPost({
          postId: input.postId,
          reporterUserId: ctx.session.uid,
          reason: input.reason,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  reportProfile: protectedProcedure
    .input(trpcValidators.input.report.reportUser)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.report.reportUser({
          reason: input.reason,
          reporterUserId: ctx.session.uid,
          targetUserId: input.targetUserId,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
