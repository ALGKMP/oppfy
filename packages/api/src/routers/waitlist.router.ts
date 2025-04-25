import { z } from "zod";

import { db, schema } from "@oppfy/db";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const waitlistRouter = createTRPCRouter({
  joinWaitlist: publicProcedure
    .input(z.object({ phone: z.string().min(6) }))
    .mutation(async ({ input }) => {
      await db
        .insert(schema.waitlist)
        .values({ phoneNumber: input.phone })
        .onConflictDoNothing();
    }),
});
