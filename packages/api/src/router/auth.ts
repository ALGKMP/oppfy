import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  emailInUse: publicProcedure
    .input(z.string().email())
    .mutation(async ({ ctx, input }) => {
      const possibleUser = await ctx.prisma.user.findUnique({
        where: { email: input },
      });

      return !!possibleUser;
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
});
