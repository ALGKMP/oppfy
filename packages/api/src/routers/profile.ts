import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { sharedValidators, trpcValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../errors";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const profileRouter = createTRPCRouter({
  createPresignedUrlForProfilePicture: protectedProcedure
    .input(trpcValidators.profile.userProfilePicture)
    .mutation(async ({ input, ctx }) => {
      const bucket = process.env.S3_PROFILE_BUCKET!;
      const key = `profile-pictures/${ctx.session.uid}.jpg`;

      return await ctx.services.s3.putObjectPresignedUrlWithProfilePictureMetadata(
        {
          Key: key,
          Bucket: bucket,
          ContentLength: input.contentLength,
          ContentType: "image/jpeg",
          Metadata: {
            user: ctx.session.uid,
          },
        },
      );
    }),

  // OpenAPI endponit for Lambda
  removeProfilePicture: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await ctx.services.profile.removeProfilePicture(ctx.session.uid);
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove profile picture",
      });
    }
  }),

  updateProfile: protectedProcedure
    .input(trpcValidators.profile.updateProfile)
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

  getCurrentUserBasicProfile: protectedProcedure
    .output(sharedValidators.user.basicProfile) // Make sure this shit doesn't return more than necessary
    .query(async ({ ctx }) => {
      try {
        return await ctx.services.profile.getBasicProfileByUserId(ctx.session.uid);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get current users basic profile",
        });
      }
    }),

  getOtherUserBasicProfile: publicProcedure
    .input(
      z.object({
        profileId: z.string(),
      }),
    )
    .output(sharedValidators.user.basicProfile) // Make sure this shit doesn't return more than necessary
    .query(async ({ ctx, input }) => {
      return await ctx.services.profile.getBasicProfileByUserId(input.profileId);
    }),

  getCurrentUsersFullProfile: protectedProcedure
    .output(sharedValidators.user.fullProfile)
    .query(async ({ ctx }) => {
      try {
        return await ctx.services.profile.getFullProfileByUserId(ctx.session.uid);
      } catch (err) {
        if (err instanceof DomainError) {
          switch (err.code) {
            case ErrorCode.USER_NOT_FOUND:
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "User not found",
              });
            default:
              throw new TRPCError({
                code: "UNPROCESSABLE_CONTENT",
                message: err.message,
              });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "err.",
        });
      }
    }),

  // TRPC Procedure for getting a full user profile
  getOtherUserFullProfile: publicProcedure
    .input(
      z.object({
        profileId: z.number(),
      }),
    )
    .output(sharedValidators.user.fullProfile)
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.profile.getFullProfileByProfileId(input.profileId);
      } catch (err) {
        if (err instanceof DomainError) {
          switch (err.code) {
            case ErrorCode.USER_NOT_FOUND:
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "User not found",
              });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get full profile for ${input.profileId}`,
        });
      }
    }),
});
