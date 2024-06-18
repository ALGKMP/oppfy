import { z } from "zod";

import { postContentType } from "../../../shared";

const trpcPostInputSchema = {
  createS3PresignedUrl: z.object({
    recipient: z.string(),
    caption: z.string().max(2000).default(""),
    contentLength: z.number(),
    contentType: postContentType,
  }),

  createMuxPresignedUrl: z.object({
    recipientId: z.string(),
    caption: z.string().optional(),
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
};

export default trpcPostInputSchema;
