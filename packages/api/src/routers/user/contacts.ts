import { TRPCError } from "@trpc/server";
import { z } from "zod";

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
  getRecommendationIds: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.contact.getRecommendationsIds(ctx.session.uid);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),
  getRecommendationProfilesOther: protectedProcedure
    .input(trpcValidators.input.contacts.getRecommendationProfilesOther)
    .output(trpcValidators.output.recommendations.recommededProfiles)
    .query(async ({ input, ctx }) => {
      try {
        return await ctx.services.contact.getRecommendationProfilesOtherByProfileId(
          input.profileId,
        );
      } catch (err) {
        console.error(err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  getRecommendationProfilesSelf: protectedProcedure
    .output(trpcValidators.output.recommendations.recommededProfiles)
    .query(async ({ ctx }) => {
      try {
        return await ctx.services.contact.getRecommendationProfilesSelf(
          ctx.session.uid,
        );
      } catch (err) {
        console.error(err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  filterOutPhoneNumbersOnApp: protectedProcedure
    .input(
      z.object({
        phoneNumbers: z.array(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.contact.filterPhoneNumbersOnApp(
        input.phoneNumbers,
      );
    }),
});
