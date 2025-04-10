import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const contactsRouter = createTRPCRouter({
  profileRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.services.contacts.getProfileRecommendations({
      userId: ctx.session.uid,
    });

    return result.match(
      (res) => res,
      (_) => _,
    );
  }),

  filterPhoneNumbersOnApp: protectedProcedure
    .input(
      z.object({
        phoneNumbers: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.contacts.filterPhoneNumbersOnApp({
        phoneNumbers: input.phoneNumbers,
      });

      return result.match(
        (res) => res,
        (_) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
          });
        },
      );
    }),

  updateUserContacts: protectedProcedure
    .input(
      z.object({
        hashedPhoneNumbers: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.contacts.updateUserContacts({
        userId: ctx.session.uid,
        hashedPhoneNumbers: input.hashedPhoneNumbers,
      });

      return result.match(
        (res) => res,
        (_) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
          });
        },
      );
    }),
});
