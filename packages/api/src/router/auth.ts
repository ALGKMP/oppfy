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
        password: z.string().min(6),
        firebaseUid: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { email, password, firebaseUid } = input;
      ctx.prisma.user.create({
        data: {
          id: firebaseUid,
          email: email,
          password: password,
        },
      });
    }),
});
