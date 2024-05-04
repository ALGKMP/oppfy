import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { trpcValidators } from "@acme/validators";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const profileRouter = createTRPCRouter({
  createPresignedUrlForProfilePicture: protectedProcedure
    .input(trpcValidators.profile.createPresignedUrl)
    .mutation(async ({ ctx, input }) => {
      const bucket = process.env.S3_PROFILE_BUCKET!;
      const key = `profile-pictures/${ctx.session.uid}.jpg`;
      const metadata = trpcValidators.user.userId.safeParse(ctx.session.uid);

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

  getProfileDetails: protectedProcedure.query(async ({ ctx }) => {
    await ctx.services.profile.getProfileDetails(ctx.session.uid);
  }),

  removeProfilePicture: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.services.profile.removeProfilePicture(ctx.session.uid);
  }),
});
