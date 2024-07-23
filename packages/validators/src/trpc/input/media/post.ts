import { z } from "zod";

import { sharedValidators } from "../../../..";
import {
  postContentType,
  s3ObjectMetadataForUserNotOnAppSchema,
  s3ObjectMetadataForUserOnAppSchema,
} from "../../../shared";

const s3MetadataOnTheAppSchema = z
  .object({
    ...s3ObjectMetadataForUserOnAppSchema.shape,
    contentLength: z.number(),
    contentType: postContentType,
  })
  .omit({ author: true });

const s3MetadataNotOnTheAppSchema = z
  .object({
    ...s3ObjectMetadataForUserNotOnAppSchema.shape,
    contentLength: z.number(),
    contentType: postContentType,
  })
  .omit({ author: true });

const s3MetadataSchema = z.discriminatedUnion("type", [
  s3MetadataOnTheAppSchema,
  s3MetadataNotOnTheAppSchema,
]);

const muxMetadataOnTheAppSchema = z
  .object(s3ObjectMetadataForUserOnAppSchema.shape)
  .omit({ author: true });

const muxMetadataNotOnTheAppSchema = z
  .object(s3ObjectMetadataForUserNotOnAppSchema.shape)
  .omit({ author: true });

const muxMetadataSchema = z.discriminatedUnion("type", [
  muxMetadataOnTheAppSchema,
  muxMetadataNotOnTheAppSchema,
]);

const trpcPostInputSchema = {
  createPresignedUrlForImagePost: s3MetadataSchema,

  createPresignedUrlForVideoPost: muxMetadataSchema,

  updatePost: z.object({
    postId: z.number(),
    caption: z.string().max(2000).default(""),
  }),

  deletePost: z.object({
    postId: z.number(),
  }),

  paginatePostsOfUserSelf: z.object({
    cursor: z
      .object({
        postId: z.number(),
        createdAt: z.date(),
      })
      .optional(),
    pageSize: z.number().nonnegative().optional(),
  }),

  paginatePostsOfUserOther: z.object({
    profileId: z.number(),
    cursor: z
      .object({
        postId: z.number(),
        createdAt: z.date(),
      })
      .optional(),
    pageSize: z.number().nonnegative().optional(),
  }),

  paginatePostsOfFollowing: z.object({
    cursor: z
      .object({
        followerId: z.number(),
        createdAt: z.date(),
      })
      .optional(),
    pageSize: z.number().nonnegative().optional(),
  }),

  paginatePostsOfRecommended: z.object({
    cursor: z
      .object({
        postId: z.number(),
        createdAt: z.date(),
      })
      .optional(),
    pageSize: z.number().nonnegative().optional(),
  }),

  paginatePostsForFeed: z.object({
    cursor: z
      .object({
        doneFollowing: z.boolean(),
        followingCursor: z
          .object({
            createdAt: z.date(),
            followerId: z.number(),
          })
          .optional(),
        recomendedCursor: z
          .object({
            createdAt: z.date(),
            postId: z.number(),
          })
          .optional(),
      })
      .optional(),

    pageSize: z.number().nonnegative().optional(),
  }),

  paginatePostsByUserSelf: z.object({
    cursor: z
      .object({
        postId: z.number(),
        createdAt: z.date(),
      })
      .optional(),
    pageSize: z.number().nonnegative().optional(),
  }),

  paginatePostsByUserOther: z.object({
    profileId: z.number(),
    cursor: z
      .object({
        postId: z.number(),
        createdAt: z.date(),
      })
      .optional(),
    pageSize: z.number().nonnegative().optional(),
  }),

  paginateComments: z.object({
    postId: z.number(),
    cursor: z
      .object({
        commentId: z.number(),
        createdAt: z.date(),
      })
      .optional(),
    pageSize: z.number().nonnegative().optional().default(10),
  }),
};

export default trpcPostInputSchema;
