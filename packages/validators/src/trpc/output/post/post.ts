import { z } from "zod";

import { post, comment } from "../../../shared"


const trpcPostOutputSchema = {
  paginatedPosts: z.object({
    items: z.array(
        post.optional(),
    ),
    nextCursor: z
      .object({
        createdAt: z.date(),
        postId: z.number(),
      })
      .optional(),
  }),
  paginatedComments: z.object({
    items: z.array(
      comment.optional(),
    ),
    nextCursor: z
      .object({
        createdAt: z.date(),
        commentId: z.number(),
      })
      .optional(),
  })
};

export default trpcPostOutputSchema;
