import { z } from "zod";

import { comment, post } from "../../../shared";

const trpcPostOutputSchema = {
  paginatedFeedPosts: z.object({
    items: z.array(post.optional()),
    nextCursor: z.object({
      doneFollowing: z.boolean(),
      nextFollowingCursor: z
        .object({
          createdAt: z.date(),
          followerId: z.number(),
        })
        .optional(),
      nextRecomendedCursor: z
        .object({
          createdAt: z.date(),
          postId: z.number(),
        })
        .optional(),
    }).optional(),
  }),
  paginatedPosts: z.object({
    items: z.array(post.optional()),
    nextCursor: z
      .object({
        createdAt: z.date(),
        postId: z.number(),
      })
      .optional(),
  }),
  paginatedComments: z.object({
    items: z.array(comment),
    nextCursor: z
      .object({
        createdAt: z.date(),
        commentId: z.number(),
      })
      .optional(),
  }),
};

export default trpcPostOutputSchema;
