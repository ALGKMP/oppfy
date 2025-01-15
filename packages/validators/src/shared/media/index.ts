import { z } from "zod";

export const postContentType = z.enum([
  "image/jpeg",
  "image/png",
  "image/heic",
]);

export const post = z.object({
  postId: z.string(),
  authorId: z.string(),
  authorProfileId: z.string(),
  authorUsername: z.string().nullable(),
  authorProfilePicture: z.string().nullable(),
  recipientId: z.string(),
  recipientProfileId: z.string(),
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
  hasLiked: z.boolean(),
});

export const comment = z.object({
  commentId: z.string(),
  userId: z.string(),
  username: z.string().nullable(),
  profilePictureUrl: z.string().nullable(),
  postId: z.string(),
  body: z.string(),
  createdAt: z.date(),
});
