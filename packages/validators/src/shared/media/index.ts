import { z } from "zod";

export const postContentType = z.enum(["image/jpeg", "image/png", "image/gif"]);

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
