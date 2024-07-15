import { z } from "zod";

import { postContentType } from "../../../shared";

const trpcPostInputSchema = {
  createS3PresignedUrl: z.object({
    recipientId: z.string(),
    caption: z.string().max(2000).default(""),
    height: z.number(),
    width: z.number(),
    contentLength: z.number(),
    contentType: postContentType,
  }),

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
        postId: z.number(),
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
        postId: z.number(),
        createdAt: z.date(),
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
