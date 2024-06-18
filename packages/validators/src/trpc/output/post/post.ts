import { z } from "zod";

import { post } from "../../../shared"


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
};

export default trpcPostOutputSchema;
