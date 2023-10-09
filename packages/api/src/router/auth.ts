import { ListBucketsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { r2 } from "@acme/db";

import { isFireBaseError } from "../services/firebase";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  emailInUse: publicProcedure
    .input(z.string().email())
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.auth.getUserByEmail(input);
      } catch (err) {
        if (!isFireBaseError(err)) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unknown error",
          });
        }

        if (err.code === "auth/user-not-found") {
          return false;
        }
      }

      return false;
    }),
  phoneNumberInUse: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: phoneNumber }) => {
      try {
        await ctx.auth.getUserByPhoneNumber(phoneNumber);
      } catch (err) {
        if (!isFireBaseError(err)) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unknown error",
          });
        }

        if (err.code === "auth/user-not-found") {
          return false;
        }
      }

      return false;
    }),
  getUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.prisma.user.findUniqueOrThrow({
        where: { id: ctx.session.uid },
      });
    } catch (_err) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }
  }),
  createUser: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        firebaseUid: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { email, firebaseUid } = input;

      try {
        await ctx.prisma.user.create({
          data: {
            id: firebaseUid,
            email: email,
          },
        });
      } catch (_err) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Unique user info already exists",
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
        message: "User not found",
      });
    }
  }),
  test: publicProcedure.query(async ({ ctx }) => {
    const command = new ListObjectsV2Command({ Bucket: "oppfy" });
    const response = await ctx.r2.send(command);
    console.log(response.Contents);
    return response.Contents;
  }),
});
