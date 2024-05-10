import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { sharedValidators, trpcValidators } from "@acme/validators";

import { DomainError, ErrorCode } from "../errors";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const profileRouter = createTRPCRouter({
  createPresignedUrlForProfilePicture: protectedProcedure
    .input(trpcValidators.profile.createPresignedUrl)
    .mutation(async ({ ctx, input }) => {
      const bucket = process.env.S3_PROFILE_BUCKET!;
      const key = `profile-pictures/${ctx.session.uid}.jpg`;
      const metadata = sharedValidators.user.userId.safeParse(ctx.session.uid);

      if (!metadata.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to generate presigned URL for profile picture upload.",
        });
      }

      return await ctx.services.aws.putObjectPresignedUrlWithProfilePictureMetadata(
        {
          Key: key,
          Bucket: bucket,
          ContentType: input.contentType,
          ContentLength: input.contentLength,
          Metadata: {
            user: metadata.data,
          },
        },
      );
    }),

  // OpenAPI endponit for Lambda
  uploadProfilePicture: publicProcedure
    .meta({ /* 👉 */ openapi: { method: "POST", path: "/profilePicture" } })
    .input(trpcValidators.profile.uploadProfilePictureOpenApi)
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      console.log("uploadProfilePicture", input);
      await ctx.services.profile.updateProfilePicture(input.user, input.key);
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
      return await ctx.services.profile.getBasicProfile(ctx.session.uid);
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
