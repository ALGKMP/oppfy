import { z } from "zod";

import {
  caption,
  contentLength,
  contentType,
  postId,
  postKey,
} from "../shared/media";
import { userId } from "../shared/user";

const trpcPostSchema = {
  createPresignedUrl: z
    .object({
      recipient: userId,
      caption,
      contentLength,
      contentType,
    })
    .refine(
      (data) =>
        ["image/jpeg", "image/png", "image/gif", "image"].includes(
          data.contentType,
        ),
      {
        // Validates file type
        message: "Invalid file type",
      },
    ),

  uploadPost: z.object({
    author: userId,
    recipient: userId,
    caption,
    key: postKey,
  }),

  updatePost: z.object({
    postId,
    caption,
  }),

  deletePost: z.object({
    postId,
  }),

  getPosts: z.object({
    cursor: z.object({
      postId,
      createdAt: z.date(),
      pageSize: z.number().optional(),
    }).optional(),
    pageSize: z.number().optional(),
  }),

  getUserPosts: z.object({
    userId,
  }),

  getBatchPost: z.object({
    postIds: z.array(postId),
  }),

  metadata: z.object({
    author: userId,
    recipient: userId,
    caption,
  }),
  profilePictureMetadata: z.object({
    user: z.string(),
  }),
};

export default trpcPostSchema;
