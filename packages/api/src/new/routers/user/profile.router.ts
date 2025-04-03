import { TRPCError } from "@trpc/server";
import { ok } from "neverthrow";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../../trpc";

export const profileRouter = createTRPCRouter({
  getProfile: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.profile.profile({
        selfUserId: ctx.session.uid,
        otherUserId: input.userId,
      });

      if (result.isErr()) {
        switch (result.error.name) {
          case "ProfileNotFoundError":
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Profile not found",
            });
        }

        return;
      }

      return result.value;

      return result.match(
        (result) => result,
        (err) => {
          switch (err.name) {
            // case "ProfileNotFoundError":
            //   throw new TRPCError({
            //     code: "NOT_FOUND",
            //     message: "Profile not found",
            //   });
            // case "ProfilePrivateError":
            //   throw new TRPCError({
            //     code: "FORBIDDEN",
            //     message: "Profile is private",
            //   });
            case "ProfileBlockedError":
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Profile is blocked",
              });
          }
        },
      );
    }),

  getProfileForSite: publicProcedure
    .input(
      z.object({
        username: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.profile.profileForSite({
        username: input.username,
      });

      return result.match(
        (result) => result,
        (err) => {
          switch (err.name) {
            case "ProfileNotFoundError":
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Profile not found",
              });
          }
        },
      );
    }),

  getProfilesByUsername: protectedProcedure
    .input(
      z.object({
        username: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const test = await ctx.services.profile.searchProfilesByUsername({
        userId: ctx.session.uid,
        username: input.username,
      });

      return test.match(
        (result) => result,
        (_) => null,
      );
    }),

  getRelationshipStatesBetweenUsers: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.profile.relationshipStatesBetweenUsers({
        selfUserId: ctx.session.uid,
        otherUserId: input.userId,
      });

      return result.match(
        (result) => result,
        (err) => {
          switch (err.name) {
            case "ProfileBlockedError":
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Profile is blocked",
              });
            case "CannotCheckRelationshipWithSelfError":
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Cannot check relationship with self",
              });
          }
        },
      );
    }),

  generateProfilePicturePresignedUrl: protectedProcedure
    .input(
      z.object({
        contentLength: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.services.profile.generateProfilePicturePresignedUrl({
        userId: ctx.session.uid,
        contentLength: input.contentLength,
      });
    }),
});
