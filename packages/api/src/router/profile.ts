import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  getSignedUrl,
  S3RequestPresigner,
} from "@aws-sdk/s3-request-presigner";

const profilePhotoBucket = "oppfy-profile-pictures";

export const profileRouter = createTRPCRouter({
  // TODO: upload - upload profile photo to db and s3
  uploadProfilePhoto: protectedProcedure
    .input(
      z.object({
        file: z.string(), // Replace with suitable file type
        key: z.string(), // For now will be a uuid, but will need to be changed to something else
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uploadParams = {
        Bucket: profilePhotoBucket,
        Key: input.key,
        Body: input.file,
      };

      const prismaInput: Prisma.ProfilePhotoCreateInput = {
        user: { connect: { id: ctx.session.uid } },
        media: { connect: { id: ctx.session.uid } },
        dateEdited: new Date(),
      };

      const s3Response = new PutObjectCommand(uploadParams)
      

      if (!s3Response) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error uploading file to R2.",
          cause: s3Response,
        });
      }

      const prismaResponse = await ctx.prisma.profilePhoto.create({
        data: prismaInput,
      });

      if (!prismaResponse) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error uploading file to R2.",
          cause: prismaResponse,
        });
      }
    }),

  // deleteProfilePhoto - delete profile photo from db and s3
  deleteProfilePhoto: protectedProcedure.mutation(async ({ ctx }) => {
    const prismaDeleteInput: Prisma.ProfilePhotoDeleteArgs = {
      where: { userId: ctx.session.uid },
    };

    const prismaResponseFindUnique =
      await ctx.prisma.profilePhoto.findUnique(prismaDeleteInput);

    if (!prismaResponseFindUnique) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error finding file in DB.",
        cause: prismaResponseFindUnique,
      });
    }

    const deleteObjectParams = {
      Bucket: profilePhotoBucket,
      Key: prismaResponseFindUnique.mediaId,
    };

    const s3Response = await ctx.s3Client.send(
      new DeleteObjectCommand(deleteObjectParams),
    );

    if (!s3Response.DeleteMarker) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting file from S3.",
        cause: s3Response,
      });
    }

    const prismaResponseDelete =
      await ctx.prisma.profilePhoto.delete(prismaDeleteInput);

    if (!prismaResponseDelete) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting file from DB.",
        cause: prismaResponseDelete,
      });
    }

    return { success: true, message: "File deleted successfully." };
  }),

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
