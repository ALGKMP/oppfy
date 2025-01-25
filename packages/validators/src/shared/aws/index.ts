import { z } from "zod";

export const metadataSchema = z
  .object({
    author: z.string(),
    recipient: z.string(),
    caption: z.string().max(255).default(""),
    height: z.string(),
    width: z.string(),
    postid: z.string(),
  })
  .catchall(z.string());

export const s3ObjectMetadataForProfilePicturesSchema = z.object({
  user: z.string(),
});
