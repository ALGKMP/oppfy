import { z } from "zod";

export const postContentType = z.enum(["image/jpeg", "image/png"]);

export const post = z.object({
  postId: z.number(),
  authorId: z.string(),
  authorProfileId: z.number(),
  authorUsername: z.string().nullable(),
  authorProfilePicture: z.string().nullable(),
  recipientId: z.string(),
  recipientProfileId: z.number(),
  recipientUsername: z.string().nullable(),
  recipientProfilePicture: z.string().nullable(), // Corrected typo
  caption: z.string().max(255).default(""),
  imageUrl: z.string(),
  height: z.number(),
  width: z.number(),
  commentsCount: z.number(),
  likesCount: z.number(),
  mediaType: z.enum(["image", "video"]),
  createdAt: z.date(), // Added missing field
});

export const comment = z.object({
  commentId: z.number(),
  userId: z.string(),
  username: z.string().nullable(),
  profilePictureUrl: z.string().nullable(),
  postId: z.number(),
  body: z.string(),
  createdAt: z.date(),
});
