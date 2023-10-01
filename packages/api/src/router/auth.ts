import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  emailInUse: publicProcedure
    .input(z.string().email())
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input },
      });
      return !!user;
    }),
  storeAccountFirebase: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        firebaseUid: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { email, firebaseUid } = input;
      console.log(firebaseUid);
      try {
        await ctx.prisma.user.create({
          data: {
            id: firebaseUid,
            email: email,
          },
        });
      } catch (err) {
        console.log(err);
      }
    }),
});
