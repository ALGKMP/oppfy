import { ListBucketsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { isFireBaseError } from "../services/firebase";
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
        message: "shits broken 3"
      });
    }
  }),
  deleteUser: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await ctx.auth.deleteUser(ctx.session.uid);
      await ctx.prisma.user.delete({
        where: { id: ctx.session.uid },
      });
    } catch (_err) {
      throw new TRPCError({
        code: "NOT_FOUND",
        // message: "User not found",
        message: "shits broken 1"
      });
    }
  }),
  hasUserDetails: protectedProcedure.mutation(async ({ ctx, input }) => {
    try {
      const { firstName, dateOfBirth } = await ctx.prisma.user.findUniqueOrThrow({
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
        message: "User not found",
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
          data: userDetails,
        });
      } catch (_err) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
    }),
});
