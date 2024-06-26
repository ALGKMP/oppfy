import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { sharedValidators, trpcValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";
import { env } from "@oppfy/env/server";

export const profileRouter = createTRPCRouter({
  updateFullName: protectedProcedure
    .input(trpcValidators.input.profile.updateFullName)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.services.profile.updateFullName(
          ctx.session.uid,
          input.fullName,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  updateDateOfBirth: protectedProcedure
    .input(trpcValidators.input.profile.updateDateOfBirth)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.profile.updateDateOfBirth(
          ctx.session.uid,
          input.dateOfBirth,
        );
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  updateUsername: protectedProcedure
    .input(trpcValidators.input.profile.updateUsername)
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.profile.updateUsername(
          ctx.session.uid,
          input.username,
        );
      } catch (err) {
        if (err instanceof DomainError) {
          if (err.code === ErrorCode.USERNAME_ALREADY_EXISTS) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Username already exists",
            });
          }
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  generatePresignedUrlForProfilePicture: protectedProcedure
    .input(trpcValidators.input.profile.generatePresignedUrlForProfilePicture)
    .mutation(async ({ input, ctx }) => {
      const key = `profile-pictures/${ctx.session.uid}.jpg`;

      return await ctx.services.s3.putObjectPresignedUrlWithProfilePictureMetadata(
        {
          Key: key,
          Bucket: env.S3_PROFILE_BUCKET,
          ContentLength: input.contentLength,
          ContentType: "image/jpeg",
          Metadata: {
            user: ctx.session.uid,
          },
        },
      );
    }),

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
    .input(trpcValidators.input.profile.updateProfile)
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

  getCompactProfileSelf: protectedProcedure
    .output(trpcValidators.output.profile.compactProfile) // Make sure this shit doesn't return more than necessary
    .query(async ({ ctx }) => {
      try {
        return await ctx.services.profile.getBasicProfileByUserId(
          ctx.session.uid,
        );
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get current users basic profile",
        });
      }
    }),

  getCompactProfileOther: publicProcedure
    .input(z.object({ userId: z.string() }))
    .output(trpcValidators.output.profile.compactProfile) // Make sure this shit doesn't return more than necessary
    .query(async ({ ctx, input }) => {
      return await ctx.services.profile.getBasicProfileByUserId(input.userId);
    }),

  getFullProfileSelf: protectedProcedure
    .output(trpcValidators.output.profile.fullProfileSelf)
    .query(async ({ ctx }) => {
      try {
        return await ctx.services.profile.getFullProfileByUserId(
          ctx.session.uid,
        );
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
  getOtherUserFullProfile: protectedProcedure
    .input(trpcValidators.input.profile.getCompactProfileOther)
    .output(trpcValidators.output.profile.fullProfileOther)
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.profile.getFullProfileByProfileId(
          ctx.session.uid,
          input.profileId,
        );
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
