import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Date } from "@acme/utils";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  createUser: publicProcedure
    .input(
      z.object({
        firebaseUid: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { firebaseUid } = input;

      try {
        await ctx.db.user.create({
          data: {
            id: firebaseUid,
          },
        });
      } catch (_err) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already exists",
        });
      }
    }),
  getUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.session.uid },
      });
    } catch (_err) {
      throw new TRPCError({
        code: "NOT_FOUND",
        // message: "User not found",
        message: "shits broken 3",
      });
    }
  }),
  deleteUser: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // transaction to ensure an atomic operation
      await ctx.db.$transaction(async (db) => {
        await db.user.delete({
          where: { id: ctx.session.uid },
        });

        await ctx.auth.deleteUser(ctx.session.uid);
      });
    } catch (_err) {
      console.log(_err);
      throw new TRPCError({
        code: "NOT_FOUND",
        // message: "User not found",
        message: "shits broken 1",
      });
    }
  }),
  hasUserDetails: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const { firstName, dateOfBirth } = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.session.uid },
        select: {
          firstName: true,
          dateOfBirth: true,
        },
      });

      return !!firstName && !!dateOfBirth;
    } catch (_err) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "shits broken 5",
      });
    }
  }),
  updateUserDetails: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(2).optional(),
        username: z.string().min(1).optional(),
        dateOfBirth: z
          .date()
          .refine((date) =>
            new Date.AgeChecker(date).isAtLeast(13).isAtMost(100).checkValid(),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input: userDetails }) => {
      try {
        await ctx.db.user.update({
          where: { id: ctx.session.uid },
          data: {
            ...userDetails,
          },
        });
      } catch (_err) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "shits broken 8",
          // message: _err
        });
      }
    }),
});
