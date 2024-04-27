import { z } from "zod";

import {
  author,
  caption,
  contentLength,
  contentType,
  friend,
  key,
} from "../utils";

const postSchema = {
  createPresignedUrl: z
    .object({
      author,
      friend,
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
    author,
    friend,
    caption,
    key,
  }),

  updatePost: z.object({
    key,
    caption,
  }),

  deletePost: z.object({
    key,
  }),

  getPost: z.object({
    key,
  }),

  getUserPosts: z.object({
    author,
  }),
};

export default postSchema;
