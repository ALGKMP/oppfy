import { z } from "zod";

import {
  caption,
  contentLength,
  contentType,
  key,
  userId,
  postId,
} from "../utils";

const postSchema = {
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
    key,
  }),

  updatePost: z.object({
    postId,
    caption,
  }),

  deletePost: z.object({
    postId,
  }),

  getPost: z.object({
    key,
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
};


export default postSchema;
