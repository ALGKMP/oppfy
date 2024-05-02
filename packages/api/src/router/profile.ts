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
  uploadProfilePictureUrl: protectedProcedure
    .input(trpcValidators.profile.createPresignedUrl)
    .mutation(async ({ ctx, input }) => {
      const bucket = process.env.S3_BUCKET_NAME!;
      const key = `profile-pictures/${ctx.session.userId}.jpg`;
      try {
        return await Services.aws.putObjectPresignedUrl(
          bucket,
          key,
          input.contentLength,
          input.contentType,
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
        await Services.profile.uploadProfilePicture(input.userId, input.key);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload profile photo.",
        });
      }
    }),

  getProfileDetails: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.uid;
      const user = await ctx.services.user.getUser(userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const profile = await ctx.services.profile.getProfileById(user.profile);
      const profilePhoto = await ctx.services.profile.getUserProfilePicture(userId);
      const posts = await ctx.services.post.getUserPosts(userId);
      const {followerCount, followingCount, friendCount} = await ctx.services.userNetwork.getUserStats(userId);

      return {
        userId: user.id,
        username: user.username,
        name: profile.name,
        bio: profile.bio,
        profilePhoto,
        posts,
        followerCount,
        followingCount,
        friendCount
      };
    }),

  profilePicture: protectedProcedure.query(async ({ ctx }) => {
    return await Services.profile.getUserProfilePicture(ctx.session.uid);
  }),

  userProfilePicture: protectedProcedure
    .input(trpcValidators.profile.userProfilePicture)
    .query(async ({ input }) => {
      return await Services.profile.getUserProfilePicture(input.userId);
    }),

  batchProfilePictures: protectedProcedure
    .input(trpcValidators.profile.batchProfilePictures)
    .query(async ({ input }) => {
      return await Services.profile.getProfilePictureBatch(input.userIds);
    }),

  deleteProfilePicture: protectedProcedure.mutation(async ({ ctx }) => {
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
