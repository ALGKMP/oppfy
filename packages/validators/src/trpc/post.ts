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
      friend: userId,
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
    friend: userId,
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
    postId,
    createdAt: z.date(),

  }),

  getUserPosts: z.object({
    userId,
  }),

  getBatchPost: z.object({
    postIds: z.array(postId),
  }),

  metadata: z.object({
    author: userId,
    friend: userId,
    caption,
  }),
  profilePictureMetadata: z.object({
    user: z.string(),
  }),
};

export default trpcPostSchema;
