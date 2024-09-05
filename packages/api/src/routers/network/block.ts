import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const blockRouter = createTRPCRouter({
  blockUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.block.blockUser(
          ctx.session.uid,
          input.userId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  isUserBlocked: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.block.areEitherUsersBlocked(
          ctx.session.uid,
          input.userId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  unblockUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.block.unblockUser(
          ctx.session.uid,
          input.userId,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  paginateBlockedUsers: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            createdAt: z.date(),
            profileId: z.string(),
          })
          .optional(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.paginate.paginateBlocked(
          ctx.session.uid,
          input.cursor,
          input.pageSize,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),
});
