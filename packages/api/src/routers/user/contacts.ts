import { TRPCError } from "@trpc/server";

import { trpcValidators } from "@oppfy/validators";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const contactsRouter = createTRPCRouter({
  syncContacts: protectedProcedure
    .input(trpcValidators.input.contacts.syncContacts)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.contact.syncContacts(ctx.session.uid, input);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),
  deleteContacts: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await ctx.services.contact.deleteContacts(ctx.session.uid);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),
  getRecomendationIds: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.contact.getRecomendationsIds(ctx.session.uid);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),
  getReccomendationProfiles: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.contact.getRecommendationProfiles(
        ctx.session.uid,
      );
    } catch (err) {
      console.error(err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),
});
