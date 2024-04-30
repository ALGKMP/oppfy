import { z } from "zod";

import {
  caption,
  contentLength,
  contentType,
  postId,
  postKey,
} from "../shared/shared.media.schema";
import { userId } from "../shared/shared.user.schema";

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

  getPost: z.object({
    key: postKey,
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

export default trpcPostSchema;
