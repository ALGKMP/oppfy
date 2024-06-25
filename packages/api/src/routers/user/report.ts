import { TRPCError } from "@trpc/server";

import { trpcValidators } from "@oppfy/validators";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const reportRouter = createTRPCRouter({
  reportPost: protectedProcedure
    .input(trpcValidators.input.report.reportPost)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.report.reportPost(
          input.postId,
          ctx.session.uid,
          input.reason,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  reportProfile: protectedProcedure
    .input(trpcValidators.input.report.reportUser)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.report.reportProfile(
          input.targetUserId,
          ctx.session.uid,
          input.reason,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
