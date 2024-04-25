/*
  This router module is designed to handle all profile-related operations. It leverages Amazon S3 for storage and provides
  functionality for generating presigned URLs for secure, client-side file uploads
*/

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import Services from "../service";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  createPresignedUrlSchema,
  profilePhotoSchema,
} from "../validation/profile";

export const profileRouter = createTRPCRouter({
  /*
    createPresignedUrlWithClient:
    A protected procedure that generates a presigned URL for uploading user profile pictures to S3. It ensures
    that the uploaded files are within a specified size limit and are of an allowed content type.
    
    Inputs:
      - uid: The user's unique identifier.
      - contentLength: The size of the file to be uploaded, used for validating against the set maximum size.
      - contentType: The MIME type of the file, used for validating allowed file types.
      - caption (optional): A caption for the profile picture.
      - tags (optional): An array of tags associated with the picture.
    
    Outputs: A presigned URL for uploading the profile picture directly to S3.
    
    Notes:
      - The procedure enforces a file size limit of 5MB and restricts uploads to JPEG, PNG, and GIF formats.
      - It constructs the S3 object key using the user's UID and a standard file extension, ensuring uniqueness
        and straightforward access patterns.
      - TODO: Look into compressing photos before uploading to reduce file size, or storing a compressed version
  */

  createPresignedUrlWithClient: protectedProcedure
    .input(createPresignedUrlSchema)
    .mutation(async ({ ctx, input }) => {
      return await Services.aws.createPresignedUrl(
        ctx.session.uid,
        input.contentLength,
        input.contentType,
      );
    }),

  profilePicture: publicProcedure
    .meta({ /* 👉 */ openapi: { method: "POST", path: "/profilePicture" } })
    .input(profilePhotoSchema)
    .output(z.void())
    .mutation(async ({ input }) => {
      try{
        await Services.profile.uploadProfilePhoto(input.userId, input.key)
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
});
