import { z } from "zod";

export const post = z.object({
  postId: z.number(),
  authorId: z.string(),
  authorUsername: z.string(),
  authorProfilePicture: z.string(),
  recipientId: z.string(),
  recipientUsername: z.string(),
  recipientProfilePicture: z.string(), // Corrected typo
  caption: z.string().nullable(),
  imageUrl: z.string(),
  commentsCount: z.number(),
  likesCount: z.number(),
  createdAt: z.date(), // Added missing field
});

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
