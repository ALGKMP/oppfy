
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { trpcValidators } from "@oppfy/validators";

import {
  createTRPCRouter,
  protectedProcedure,
} from "../../trpc";

export const contactsRouter = createTRPCRouter({
  syncContacts: protectedProcedure
    .input(trpcValidators.input.contacts.syncContacts)
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(input)
        // await ctx.services.contact.syncContacts(ctx.session.uid, input);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),
});
