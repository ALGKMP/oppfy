import { z } from "zod";

export const postContentType = z.enum(["image/jpeg", "image/png", "image/gif"]);

export const post = z.object({
  postId: z.number(),
  authorId: z.string(),
  authorProfileId: z.number(),
  authorUsername: z.string().nullable(),
  authorProfilePicture: z.string(),
  recipientId: z.string(),
  recipientProfileId: z.number(),
  recipientUsername: z.string().nullable(),
  recipientProfilePicture: z.string(), // Corrected typo
  caption: z.string().default(""),
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
  profilePictureUrl: z.string(),
  postId: z.number(),
  body: z.string(),
  createdAt: z.date(),
});

export const postMetadataForS3 = z.object({
  author: z.string(),
  recipient: z.string(),
  caption: z.string().max(2000).default(""),
  width: z.string(),
  height: z.string(),
});
