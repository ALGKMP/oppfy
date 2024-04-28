import { z } from "zod";

import {
  contentLength,
  contentType,
  key,
  profiles,
  profileId,
  userId,
} from "../utils";

const profileSchemas = {
  createPresignedUrl: z
    .object({
      contentLength,
      contentType,
    })
    .refine((data) => data.contentLength <= 5 * 1024 * 1024, {
      message: "File too large", // Validates file size to not exceed 5 MB
    })
    .refine(
      (data) =>
        ["image/jpeg", "image/png", "image/gif", "image"].includes(
          data.contentType,
        ),
      {
        message: "Invalid file type", // Validates allowed image content types
      },
    ),

  uploadProfilePictureOpenApi: z.object({
    userId,
    key,
  }),

  getProfilePicture: z.object({
    profileId,
  }),

  removeProfilePhoto: z.object({
    key,
  }),
  getListOfProfilePictureUrls: z.object({
    profiles,
  }),
};

export default profileSchemas;
