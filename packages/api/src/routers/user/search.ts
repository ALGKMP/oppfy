import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

import { createTRPCRouter, protectedProcedure } from "../../trpc"; // Import TRPC utilities

export const searchRouter = createTRPCRouter({
  profilesByUsername: protectedProcedure
    .input(
      z.object({
        username: sharedValidators.user.username,
      }),
    )
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
