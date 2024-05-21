import { z } from "zod";

const trpcPostInputSchema = {
  createS3PresignedUrl: z
    .object({
      recipient: z.string(),
      caption: z.string().max(2000).default(""),
      contentLength: z.number(),
      contentType: z.string(),
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

  createMuxPresignedUrl: z.object({
    recipientId: z.string(),
    caption: z.string().optional(),
  }),

  updatePost: z.object({
    postId: z.number(),
    caption: z.string().max(2000).default(""),
  }),

  deletePost: z.object({
    postId: z.number(),
  }),

  paginatePosts: z.object({
    cursor: z
      .object({
        postId: z.number(),
        createdAt: z.date(),
      })
      .optional(),
    pageSize: z.number().nonnegative().optional(),
  }),
};

export default trpcPostInputSchema;
