import { TRPCError } from "@trpc/server";

import { trpcValidators } from "@oppfy/validators";

import { createTRPCRouter, protectedProcedure } from "../../trpc"; // Import TRPC utilities

export const searchRouter = createTRPCRouter({
  profilesByUsername: protectedProcedure
    .input(trpcValidators.input.search.profilesByUsername)
    .mutation(async ({ ctx, input }) => {
      try {
        return ctx.services.search.profilesByUsername(
          input.username,
          ctx.session.uid,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search for profiles by username",
          cause: err,
        });
      }
    }),
});
