import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const contactsRouter = createTRPCRouter({
  syncContacts: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.contact.syncContacts({
          userId: ctx.session.uid,
          contacts: input,
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  deleteContacts: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await ctx.services.contact.deleteContacts({
        userId: ctx.session.uid,
      });
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),

  getRecommendationProfilesSelf: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.contact.getRecommendationProfilesSelf({
        userId: ctx.session.uid,
      });
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
      return await ctx.services.contact.filterPhoneNumbersOnApp({
        phoneNumbers: input.phoneNumbers,
      });
    }),
});
