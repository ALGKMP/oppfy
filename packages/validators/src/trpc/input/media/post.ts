import { z } from "zod";

import { sharedValidators } from "../../../..";
import {
  postContentType,
  s3ObjectMetadataForUserNotOnAppSchema,
  s3ObjectMetadataForUserOnAppSchema,
} from "../../../shared";

const metadataOnTheAppSchema = z
  .object({
    ...s3ObjectMetadataForUserOnAppSchema.shape,
    contentLength: z.number(),
    contentType: postContentType,
  })
  .omit({ author: true });

const metadataNotOnTheAppSchema = z
  .object({
    ...s3ObjectMetadataForUserNotOnAppSchema.shape,
    contentLength: z.number(),
    contentType: postContentType,
  })
  .omit({ author: true });

const metadataSchema = z.discriminatedUnion("type", [
  metadataOnTheAppSchema,
  metadataNotOnTheAppSchema,
]);

const trpcPostInputSchema = {
  createPresignedUrlForPost: metadataSchema,

  createMuxPresignedUrl: z.object({
    recipientId: z.string(),
    caption: z.string().optional(),
    height: z.number(),
    width: z.number(),
  }),

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
