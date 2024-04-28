import { z } from "zod";

import {
  author,
  caption,
  contentLength,
  contentType,
  friend,
  profileId,
  key,
  userId,
  postId,
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
    author,
  }),

  getProfilePosts: z.object({
    profileId,
  }),

  getBatchPost: z.object({
    postIds: z.array(postId),
  }),
};

export default postSchema;
