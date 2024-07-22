import { z } from "zod";

export const userTypeEnum = z.enum(["onApp", "notOnApp"]);

const baseSchema = z.object({
  author: z.string(),
  caption: z.string().default(""),
  height: z.string().transform((val) => parseInt(val)),
  width: z.string().transform((val) => parseInt(val)),
});

const s3ObjectMetadataForUserOnAppSchema = baseSchema.extend({
  recipient: z.string(),
  type: z.literal("onApp"),
});

const s3ObjectMetadataForUserNotOnAppSchema = baseSchema.extend({
  phoneNumber: z.string(),
  type: z.literal("notOnApp"),
});

export const metadataSchema = z.discriminatedUnion("type", [
  s3ObjectMetadataForUserOnAppSchema,
  s3ObjectMetadataForUserNotOnAppSchema,
]);

export const s3ObjectMetadataForProfilePicturesSchema = z.object({
  user: z.string(),
});
