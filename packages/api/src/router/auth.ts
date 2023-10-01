import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
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
