/*
  This router module is designed to handle all profile-related operations. It leverages Amazon S3 for storage and provides
  functionality for generating presigned URLs for secure, client-side file uploads
*/

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import Services from "../service";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import ZodSchemas from "../validation"

export const profileRouter = createTRPCRouter({

  createPresignedUrlForProfilePictureUpload: protectedProcedure
    .input(ZodSchemas.profile.createPresignedUrl)
    .mutation(async ({ ctx, input }) => {
      return await Services.aws.uploadProfilePictureUrl(
        ctx.session.uid,
        input.contentLength,
        input.contentType,
      );
    }),

  uploadProfilePicture: publicProcedure
    .meta({ /* 👉 */ openapi: { method: "POST", path: "/profilePicture" } })
    .input(ZodSchemas.profile.uploadProfilePictureOpenApi)
    .output(z.void())
    .mutation(async ({ input }) => {
      try {
        await Services.profile.uploadProfilePicture(input.userId, input.key);
      } catch (error) {
        console.error(
          "Error uploading profile photo:",
          error instanceof Error ? error.message : error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload profile photo.",
        });
      }
    }),

  getListOfProfilePictureUrls: protectedProcedure
  .input(ZodSchemas.profile.getListOfProfilePictureUrls)
  .mutation(async ({ input }) => {
    return await Services.aws.getProfilePictureUrls(input.profiles);
  }),

  removeProfilePhoto: protectedProcedure
    .input(ZodSchemas.profile.removeProfilePhoto)
    .mutation(async ({ ctx, input }) => {
      try{
        await Services.profile.deleteProfilePhoto(ctx.session.uid);
        await Services.aws.deleteObject(ctx.session.uid, input.key);
      } catch (error) {
        console.error(
          "Error removing profile photo:",
          error instanceof Error ? error.message : error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove profile photo.",
        });
      }
    }),
});
