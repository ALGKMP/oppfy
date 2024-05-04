import { TRPCError } from "@trpc/server";

import { trpcValidators } from "@acme/validators";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  createUser: publicProcedure
    .input(trpcValidators.auth.createUser)
    .mutation(async ({ ctx, input }) => {
      await ctx.services.user.createUser(input.userId);
    }),

  getUser: protectedProcedure.query(async ({ ctx }) => {
    await ctx.services.user.getUser(ctx.session.uid);
  }),

  deleteUser: protectedProcedure
    .input(trpcValidators.auth.deleteUser)
    .mutation(async ({ ctx, input }) => {
      await ctx.services.user.deleteUser(input.userId);
    }),

  userOnboardingCompleted: protectedProcedure
    .input(trpcValidators.user.userComplete)
    .mutation(async ({ ctx }) => {
      return await ctx.services.user.userOnboardingCompleted(ctx.session.uid);
    }),
});

export type AuthRouter = typeof authRouter;
