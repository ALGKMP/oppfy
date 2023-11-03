import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  test: publicProcedure.query(async ({ ctx }) => {
    return { message: "hello world" };
  }),
  testing: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/test",
      },
    })
    .input(z.void())
    .output(
      z.object({
        message: z.string(),
      }),
    )
    .query(() => {
      return { message: "hello world" };
    }),
  createUser: publicProcedure
    .input(
      z.object({
        firebaseUid: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { firebaseUid } = input;

      try {
        await ctx.prisma.user.create({
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
      return await ctx.prisma.user.findUniqueOrThrow({
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
      await ctx.prisma.user.delete({
        where: { id: ctx.session.uid },
      });
    } catch (_err) {
      throw new TRPCError({
        code: "NOT_FOUND",
        // message: "User not found",
        message: "shits broken 1",
      });
    }
  }),
  hasUserDetails: protectedProcedure.mutation(async ({ ctx, input }) => {
    try {
      const { firstName, dateOfBirth } =
        await ctx.prisma.user.findUniqueOrThrow({
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
        firstName: z.string().min(1).optional(),
        dateOfBirth: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input: userDetails }) => {
      try {
        await ctx.prisma.user.update({
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
