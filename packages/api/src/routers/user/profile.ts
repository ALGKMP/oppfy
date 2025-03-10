import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import {
  createTRPCRouter,
  protectedProcedure,
  protectedWithUserAccess,
  publicProcedure,
} from "../../trpc";

export const profileRouter = createTRPCRouter({
  createProfilePicturePresignedUrl: protectedProcedure
    .input(
      z.object({
        contentLength: z.number().refine((size) => size < 5 * 1024 * 1024),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.profile.getUploadProfilePictureUrl({
          userId: ctx.session.uid,
          contentLength: input.contentLength,
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get profile picture upload URL",
          cause: err,
        });
      }
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: sharedValidators.user.name.optional(),
        username: sharedValidators.user.username.optional(),
        bio: sharedValidators.user.bio.optional(),
        dateOfBirth: sharedValidators.user.dateOfBirth.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.profile.updateProfile(ctx.session.uid, input);
      } catch (err) {
        if (err instanceof DomainError) {
          switch (err.code) {
            case ErrorCode.USERNAME_ALREADY_EXISTS:
              throw new TRPCError({
                code: "CONFLICT",
                message: "Username already exists",
              });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
        });
      }
    }),

  getProfileSelf: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.profile.getProfileSelf(ctx.session.uid);
    } catch (err) {
      console.error(err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),

  getProfileForNextJs: publicProcedure
    .input(
      z.object({
        username: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.profile.getProfileByUsername(input.username);
      } catch (err) {
        console.error(err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  getNetworkRelationships: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.services.profile.getNetworkConnectionStatesBetweenUsers({
        currentUserId: ctx.session.uid,
        otherUserId: input.userId,
      });
    }),

  // TRPC Procedure for getting a full user profile
  getProfileOther: protectedWithUserAccess
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.profile.getProfileOther({
          currentUserId: ctx.session.uid,
          otherUserId: input.userId,
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get full profile for ${input.userId}`,
        });
      }
    }),

  searchByUsername: protectedProcedure
    .input(
      z.object({
        username: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.services.profile.searchProfilesByUsername(
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
