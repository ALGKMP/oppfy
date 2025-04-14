import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const notificationRouter = createTRPCRouter({
  storePushToken: protectedProcedure
    .input(
      z.object({
        pushToken: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.notification.storePushToken({
        userId: ctx.session.uid,
        pushToken: input.pushToken,
      });

      return result.match(
        (res) => res,
        (_) => {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        },
      );
    }),

  deletePushToken: protectedProcedure
    .input(
      z.object({
        pushToken: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.notification.deletePushToken({
        userId: ctx.session.uid,
        pushToken: input.pushToken,
      });

      return result.match(
        (res) => res,
        (_) => {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        },
      );
    }),

  notificationSettings: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.services.notification.notificationSettings(
      ctx.session.uid,
    );

    return result.match(
      (res) => res,
      (error) => {
        switch (error.name) {
          case "NotificationSettingsNotFoundError":
            throw new TRPCError({
              code: "NOT_FOUND",
              message: error.message,
            });
        }
      },
    );
  }),

  updateNotificationSettings: protectedProcedure
    .input(
      z.object({
        likes: z.boolean(),
        posts: z.boolean(),
        comments: z.boolean(),
        mentions: z.boolean(),
        friendRequests: z.boolean(),
        followRequests: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.notification.updateNotificationSettings(
        {
          userId: ctx.session.uid,
          settings: input,
        },
      );

      return result.match(
        (res) => res,
        (_) => {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        },
      );
    }),

  unreadNotificationsCount: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.services.notification.unreadNotificationsCount(
      ctx.session.uid,
    );

    return result.match(
      (res) => res,
      (_) => {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      },
    );
  }),

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
