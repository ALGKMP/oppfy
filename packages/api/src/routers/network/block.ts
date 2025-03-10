import { TRPCError } from "@trpc/server";
import { z } from "zod";

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
        return await ctx.services.block.blockUser({
          userId: ctx.session.uid,
          userIdBeingBlocked: input.userId,
        });
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
        return await ctx.services.block.unblockUser({
          userId: ctx.session.uid,
          blockedUserId: input.userId,
        });
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
          .nullable(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.paginate.paginateBlocked({
          userId: ctx.session.uid,
          cursor: input.cursor,
          pageSize: input.pageSize,
        });
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
      }
    }),
});
