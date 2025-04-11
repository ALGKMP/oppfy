import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const notificationRouter = createTRPCRouter({
  paginateNotifications: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            id: z.string(),
            createdAt: z.date(),
          })
          .optional(),
        pageSize: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.notification.paginateNotifications({
        userId: ctx.session.uid,
        cursor: input.cursor,
        pageSize: input.pageSize,
      });

      return result.match(
        (res) => res,
        (_) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
          });
        },
      );
    }),
});
