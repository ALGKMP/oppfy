import { TRPCError } from "@trpc/server";
import { trpcValidators, sharedValidators } from "@oppfy/validators";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const blockRouter = createTRPCRouter({
  blockUser: protectedProcedure
    .input(trpcValidators.input.block.blockUser)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.block.blockUser(
          ctx.session.uid,
          input.blockUserId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  isUserBlocked: protectedProcedure
    .input(trpcValidators.input.block.isUserBlocked)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.block.isUserBlocked(
          ctx.session.uid,
          input.blockedUserId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  unblockUser: protectedProcedure
    .input(trpcValidators.input.block.unblockUser)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.block.unblockUser(
          ctx.session.uid,
          input.blockedUserId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  paginateBlockedUsers: protectedProcedure
    .input(trpcValidators.input.block.paginateBlockedUsers)
    .output(trpcValidators.output.post.paginatedPosts)
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.services.paginate.paginateBlocked(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
        return trpcValidators.output.post.paginatedPosts.parse(result);
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),
});
