import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { sharedValidators, trpcValidators } from "@acme/validators";

import { DomainError, ErrorCode } from "../errors";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const profileRouter = createTRPCRouter({
  createPresignedUrlForProfilePicture: protectedProcedure.mutation(
    async ({ ctx }) => {
      const bucket = process.env.S3_PROFILE_BUCKET!;
      const key = `profile-pictures/${ctx.session.uid}.jpg`;

      return await ctx.services.aws.putObjectPresignedUrlWithProfilePictureMetadata(
        {
          Key: key,
          Bucket: bucket,
          ContentLength: 5242880,
          ContentType: "image/jpeg",
          Metadata: {
            user: ctx.session.uid,
          },
        },
      );
    },
  ),

  // OpenAPI endponit for Lambda
  uploadProfilePicture: publicProcedure
    .meta({ /* 👉 */ openapi: { method: "POST", path: "/profilePicture" } })
    .input(trpcValidators.profile.uploadProfilePictureOpenApi)
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.services.profile.updateProfilePicture(input.user, input.key);
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
          message: "A non-domain error occurred",
        });
      }
    }),

  removeProfilePicture: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.services.profile.removeProfilePicture(ctx.session.uid);
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
        });
      }
    }),

  getCurrentUserBasicProfile: protectedProcedure
    .output(sharedValidators.user.basicProfile) // Make sure this shit doesn't return more than necessary
    .query(async ({ ctx }) => {
      try {
        return await ctx.services.profile.getBasicProfile(ctx.session.uid);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  getBasicProfile: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .output(sharedValidators.user.basicProfile) // Make sure this shit doesn't return more than necessary
    .query(async ({ ctx, input }) => {
      return await ctx.services.profile.getBasicProfile(input.userId);
    }),

  getCurrentUsersFullProfile: protectedProcedure
    .output(sharedValidators.user.fullProfile)
    .query(async ({ ctx }) => {
      try {
        return await ctx.services.profile.getFullProfile(ctx.session.uid);
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
          message: "A non-domain error occurred",
        });
      }
    }),

  // TRPC Procedure for getting a full user profile
  getFullProfile: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .output(sharedValidators.user.fullProfile)
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.profile.getFullProfile(input.userId);
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
          message: "A non-domain error occurred",
        });
      }
    }),
});
