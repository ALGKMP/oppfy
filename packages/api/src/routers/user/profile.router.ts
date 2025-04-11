import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { validators } from "@oppfy/validators";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";

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

      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "ProfileNotFoundError":
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Profile not found",
              });
            case "ProfilePrivateError":
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Profile is private",
              });
            case "ProfileBlockedError":
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Profile is blocked",
              });
          }
        },
      );
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        username: z.string().optional(),
        bio: z.string().optional(),
        dateOfBirth: validators.dateOfBirth.optional(),
        profilePictureKey: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.services.profile.updateProfile({
        userId: ctx.session.uid,
        update: {
          name: input.name,
          username: input.username,
          bio: input.bio,
          profilePictureKey: input.profilePictureKey,
          dateOfBirth: input.dateOfBirth,
        },
      });
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
        (res) => res,
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
      const result = await ctx.services.profile.searchProfilesByUsername({
        userId: ctx.session.uid,
        username: input.username,
      });

      return result.match(
        (res) => res,
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
        (res) => res,
        (err) => {
          switch (err.name) {
            case "CannotCheckRelationshipWithSelfError":
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Cannot check relationship with self",
              });
          }
        },
      );
    }),

  getProfileStats: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.services.profile.stats({
        selfUserId: ctx.session.uid,
        otherUserId: input.userId,
      });
      return result.match(
        (res) => res,
        (err) => {
          switch (err.name) {
            case "ProfileBlockedError":
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Profile is blocked",
              });
            case "StatsNotFoundError":
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Profile stats not found",
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
    .mutation(async ({ ctx, input }) => {
      const result =
        await ctx.services.profile.generateProfilePicturePresignedUrl({
          userId: ctx.session.uid,
          contentLength: input.contentLength,
        });

      return result.match(
        (res) => res,
        (_) => null,
      );
    }),
});
