import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const profilePhotoBucket = "oppfy-profile-pictures";

export const profileRouter = createTRPCRouter({
  // getProfilePhoto - get profile photo from db
  getProfilePhoto: protectedProcedure.query(async ({ ctx }) => {
    const prismaFindUniqueInput: Prisma.ProfilePhotoFindUniqueArgs = {
      where: { userId: ctx.session.uid },
    };

    const prismaResponse = await ctx.prisma.profilePhoto.findUnique(
      prismaFindUniqueInput,
    );

    if (!prismaResponse) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error finding profile photo in DB",
        cause: prismaResponse,
      });
    }
    const getObjectParams = {
      Bucket: profilePhotoBucket,
      Key: prismaResponse.mediaId,
    };

    const s3Response = await ctx.s3Client.send(
      new GetObjectCommand(getObjectParams),
    );

    if (!s3Response) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error getting profile photo from S3.",
        cause: s3Response,
      });
    }
  }),

  // TODO: UpdateProfilePhoto - update profile info in db
  updateProfileInfo: protectedProcedure
    .input(
      z.object({
        bio: z.string().optional(),
        location: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const prismaUpdateInput: Prisma.UserUpdateArgs = {
        where: { id: ctx.session.uid },
        data: input,
      };
      const prismaResponse = await ctx.prisma.user.update(prismaUpdateInput);

      if (!prismaResponse) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error updating profile info in DB.",
          cause: prismaResponse,
        });
      }
      return prismaResponse;
    }),

  // TODO: getProfileContent - get everything about a user from db
  getProfileContent: protectedProcedure
    .input(z.object({ includeProfilePhoto: z.boolean() }))
    .query(async ({ ctx, input }) => {
      let prismaFindUniqueInput: Prisma.UserFindUniqueArgs = {
        where: { id: ctx.session.uid },
        include: {
          profilePhoto: true,
          createdPosts: true,
          postsOf: true,
          likedPosts: true,
          comments: true,
        },
      };

      if (!input.includeProfilePhoto) {
        prismaFindUniqueInput = {
          where: { id: ctx.session.uid },
          include: {
            profilePhoto: true,
            createdPosts: true,
            postsOf: true,
            likedPosts: true,
            comments: true,
          },
        };
      }

      const prismaResponse = await ctx.prisma.user.findUnique(
        prismaFindUniqueInput,
      );

      if (!prismaResponse) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error finding user in DB.",
          cause: prismaResponse,
        });
      }

      return prismaResponse;
    }),

  // TODO: getProfilePosts - get posts from db
  getProfilePosts: protectedProcedure.query(async ({ ctx }) => {
    const prismaResponse = await ctx.prisma.post.findMany({
      where: { authorId: ctx.session.uid },
    });
    return prismaResponse;
  }),
  // TODO: get Specific Profile Post - get single post from db
});
