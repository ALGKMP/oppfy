import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { sharedValidators, trpcValidators } from "@acme/validators";

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

  getFullProfile: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .output(sharedValidators.user.fullProfile) // Make sure this shit doesn't return more than necessary
    .query(async ({ ctx, input }) => {
      return await ctx.services.profile.getFullProfile(input.userId);
    }),

  // TODO: paginate getting followers

  // TODO: paginate getting following

  // TODO: paginate getting friends

  // TODO: paginate getting posts
});
