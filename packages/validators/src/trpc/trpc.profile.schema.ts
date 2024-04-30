import { z } from "zod";

// import { contentLength, contentType, key, userId } from "../shared";
import { contentLength, contentType, profilePictureKey } from "../shared/shared.media.schema";
import { userId } from "../shared/shared.user.schema";

const trpcProfileSchema = {
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
    key: profilePictureKey,
  }),

  userProfilePicture: z.object({
    userId,
  }),

  batchProfilePictures: z.object({ userIds: z.array(userId) }),
};

export default trpcProfileSchema;
