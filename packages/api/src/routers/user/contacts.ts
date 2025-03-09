import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const contactsRouter = createTRPCRouter({
  syncContacts: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.contact.syncContacts(ctx.session.user.id, input);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),
  deleteContacts: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await ctx.services.contact.deleteContacts(ctx.session.user.id);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),
  getRecommendationIds: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.contact.getRecommendationsIds(
        ctx.session.user.id,
      );
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),

  getRecommendationProfilesSelf: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.contact.getRecommendationProfilesSelf(
        ctx.session.user.id,
      );
    } catch (err) {
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
