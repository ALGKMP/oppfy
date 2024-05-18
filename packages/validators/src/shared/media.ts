import { z } from "zod";

export const profilePictureKey = z.string().regex(/^(profile-pictures\/).*/);
export const postKey = z.string().regex(/^(posts\/).*/);
// TODO: Inherrit type from trpc route instead of defining it here
export const paginatedPosts = z.object({
  items: z.array(
    z.object({
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
    }).optional(),
  ),
  nextCursor: z
    .object({
      createdAt: z.date(),
      postId: z.number(),
    })
    .optional(),
});

export const postId = z.number();
export const contentType = z.string();
export const contentLength = z.number();
export const caption = z.string();
