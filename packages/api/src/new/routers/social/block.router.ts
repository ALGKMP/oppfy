import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../../trpc";

export const blockRouter = createTRPCRouter({
  blockUser: protectedProcedure
    .input(
      z.object({
        recipientUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.block.blockUser({
        recipientUserId: input.recipientUserId,
        senderUserId: ctx.session.uid,
      });

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "CannotBlockSelfError": {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Cannot block self",
              });
            }
            case "AlreadyBlockedError": {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Already blocked",
              });
            }
          }
        },
      );
    }),

  unblockUser: protectedProcedure
    .input(
      z.object({
        recipientUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.block.unblockUser({
        senderUserId: ctx.session.uid,
        recipientUserId: input.recipientUserId,
      });

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "BlockNotFoundError": {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Block not found",
              });
            }
          }
        },
      );
    }),

  paginateBlockedUsers: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string(),
            createdAt: z.date(),
          })
          .nullable(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.block.paginateBlockedUsers({
        userId: ctx.session.uid,
        cursor: input.cursor,
        pageSize: input.pageSize,
      });

      return result.match(
        (res) => res,
        (_) => _,
      );
    }),
});
