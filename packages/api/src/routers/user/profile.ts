import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { eq, schema } from "@oppfy/db";
import { sharedValidators } from "@oppfy/validators";

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
      return await ctx.services.s3.uploadProfilePictureUrl({
        userId: ctx.session.uid,
        contentLength: input.contentLength,
      });
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
        name: sharedValidators.user.name.optional(),
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

  getNetworkRelationships: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.services.profile.getNetworkConnectionStatesBetweenUsers({
        currentUserId: ctx.session.uid,
        otherUserId: input.userId,
      });
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
