import { z } from "zod";

export const userTypeEnum = z.enum(["onApp", "notOnApp"]);

export const s3ObjectMetadataForUserOnAppSchema = z.object({
  author: z.string(),
  recipient: z.string(),
  caption: z.string().transform((val) => val),
  height: z.string().transform((val) => parseInt(val)),
  width: z.string().transform((val) => parseInt(val)),
  type: z.literal("onApp"),
});

export const s3ObjectMetadataForUserNotOnAppSchema = z.object({
  author: z.string(),
  phoneNumber: z.string(),
  caption: z.string().transform((val) => val),
  height: z.string().transform((val) => parseInt(val)),
  width: z.string().transform((val) => parseInt(val)),
  type: z.literal("notOnApp"),
});

export const s3ObjectMetadataForProfilePicturesSchema = z.object({
  userId: z.string(),
});
