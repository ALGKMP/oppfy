/*
  This router module is designed to handle all profile-related operations. It leverages Amazon S3 for storage and provides
  functionality for generating presigned URLs for secure, client-side file uploads
*/

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import Services from "../service";
import {createPresignedUrlSchema} from "../validation/profile";

import { eq, schema } from "@acme/db";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

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
      return await Services.aws.createPresignedUrl(ctx.session.uid, input.contentLength, input.contentType);
    }),

  profilePicture: publicProcedure
    .meta({ /* 👉 */ openapi: { method: "POST", path: "/profilePicture" } })
    .input(
      z.object({
        user: z.string(),
        key: z.string(),
        bucket: z.string(),
      }),
    )
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.query.user.findFirst({
        where: eq(schema.user.id, input.user),
        columns: {
          profile: true,
        },
      });
      if (!user?.profile) {
        // For now, assume a profile is always created in the auth flow
        throw new TRPCError({
          message: "User profile not found",
          code: "NOT_FOUND",
        });
      }

      const profile = await ctx.db.query.profile.findFirst({
        where: eq(schema.profile.id, user.profile),
        columns: {
          profilePhoto: true,
        },
      });

      if (!profile) {
        throw new TRPCError({
          message: "Error getting profile",
          code: "NOT_FOUND",
        });
      }

      if (!profile?.profilePhoto) {
        // Create new profile photo record
        const profilePhoto = await ctx.db
          .insert(schema.profilePhoto)
          .values({
            key: input.key,
          });

        console.log(`New profile photo: ${profilePhoto[0].insertId}`);

        // Associate the profile photo with the user's profile
        await ctx.db
          .update(schema.profile)
          .set({
            profilePhoto: profilePhoto[0].insertId,
          })
          .where(eq(schema.profile.id, user.profile));
      }
      else {
        // Update existing profile photo record
        await ctx.db
          .update(schema.profilePhoto)
          .set({
            key: input.key,
          })
          .where(eq(schema.profilePhoto.id, profile.profilePhoto));
        console.log(`Updated profile photo: ${profile.profilePhoto}`);
      }
    }),
});
