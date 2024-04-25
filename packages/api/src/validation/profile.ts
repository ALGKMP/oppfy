import { z } from "zod";

export const createPresignedUrlSchema = z
  .object({
    contentLength: z.number(),
    contentType: z.string(),
  })
  .refine((data) => data.contentLength <= 5 * 1024 * 1024, {
    // Validates file size
    message: "File too large",
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
  );
