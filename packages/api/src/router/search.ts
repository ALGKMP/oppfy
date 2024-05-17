import { trpcValidators } from "@oppfy/validators";

import { createTRPCRouter, protectedProcedure } from "../trpc"; // Import TRPC utilities

export const searchRouter = createTRPCRouter({
  profilesByUsername: protectedProcedure
    .input(trpcValidators.search.profilesByUsername)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.search.profilesByUsername(input.username);
    }),
});
