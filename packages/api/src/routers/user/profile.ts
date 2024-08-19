import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { eq, schema } from "@oppfy/db";
import { env } from "@oppfy/env";
import { sharedValidators, trpcValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const profileRouter = createTRPCRouter({
  getProfileId: protectedProcedure.input(z.void()).mutation(async ({ ctx }) => {
    const possibleUser = await ctx.db.query.user.findFirst({
      where: eq(schema.user.id, ctx.session.uid),
    });

    if (possibleUser === undefined) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return possibleUser.profileId;
  }),

  getProfileIdByUsername: protectedProcedure
    .input(
      z.object({
        username: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const possibleProfile = await ctx.db.query.profile.findFirst({
        where: eq(schema.profile.username, input.username),
      });

      if (possibleProfile === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return possibleProfile.id;
    }),

  generatePresignedUrlForProfilePicture: protectedProcedure
    .input(
      z.object({
        contentLength: z.number().refine((size) => size < 5 * 1024 * 1024),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const key = `profile-pictures/${ctx.session.uid}.jpg`;

      const metadata = {
        user: ctx.session.uid,
      };

      return await ctx.services.s3.putObjectPresignedUrlWithProfilePictureMetadata(
        {
          Key: key,
          Bucket: env.S3_PROFILE_BUCKET,
          ContentLength: input.contentLength,
          ContentType: "image/jpeg",
          Metadata: metadata,
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
    .input(
      z.object({
        fullName: sharedValidators.user.fullName.optional(),
        username: sharedValidators.user.username.optional(),
        bio: sharedValidators.user.bio.optional(),
        dateOfBirth: sharedValidators.user.dateOfBirth.optional(),
      }),
    )
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

  getBatchProfiles: protectedProcedure
    .input(z.array(z.string()).nonempty())
    .query(async ({ ctx, input }) => {
      return await ctx.services.profile.getBatchProfiles(input);
    }),

  getFullProfileSelf: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.services.profile.getFullProfileSelf(ctx.session.uid);
    } catch (err) {
      console.error(err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),

  // TRPC Procedure for getting a full user profile
  getFullProfileOther: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.services.profile.getFullProfileOther({
          currentUserId: ctx.session.uid,
          otherUserId: input.userId,
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get full profile for ${input.userId}`,
        });
      }
    }),
});
