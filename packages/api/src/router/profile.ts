/*
  This router module is designed to handle all profile-related operations. It leverages Amazon S3 for storage and provides
  functionality for generating presigned URLs for secure, client-side file uploads
*/

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { trpcValidators } from "@acme/validators";

import Services from "../services";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const profileRouter = createTRPCRouter({
  createPresignedUrlForProfilePicture: protectedProcedure
    .input(trpcValidators.profile.createPresignedUrl)
    .mutation(async ({ ctx, input }) => {
      console.log("writing presigned jawn here")
      const bucket = process.env.S3_PROFILE_BUCKET!;
      const key = `profile-pictures/${ctx.session.userId}.jpg`;
      const metadata = {
        user: ctx.session.uid,
      };
      try {
        return await Services.aws.putObjectPresignedUrlWithMetadataProfilePicture(
          bucket,
          key,
          input.contentLength,
          input.contentType,
          metadata
        );
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to generate presigned URL for profile picture upload.",
        });
      }
    }),

  // OpenAPI endponit for Lambda
  uploadProfilePicture: publicProcedure
    .meta({ /* 👉 */ openapi: { method: "POST", path: "/profilePicture" } })
    .input(trpcValidators.profile.uploadProfilePictureOpenApi)
    .output(z.void())
    .mutation(async ({ input }) => {
      try {
        await Services.profile.uploadProfilePicture(input.user, input.key);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload profile photo.",
        });
      }
    }),

  getProfileDetails: protectedProcedure
    .query(async ({ ctx }) => {
      try{
        return await Services.profile.getProfileDetails(ctx.session.uid);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve profile details.",
        });
      }
    }),

  removeProfilePicture: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await Services.profile.deleteProfilePicture(ctx.session.uid);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove profile photo.",
      });
    }
  }),
});
