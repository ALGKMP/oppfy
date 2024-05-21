import { z } from "zod";

const trpcBlockOutputSchema = {
  paginateBlocked: z.object({
    items: z.array(
      z.object({
        userId: z.string(),
        username: z.string(),
        name: z.string(),
        profilePictureUrl: z.string(),
      }),
    ),
    nextCursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
  }),
};

export default trpcBlockOutputSchema;
