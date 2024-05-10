import { z } from "zod";

// import { contentLength, contentType, key, userId } from "../shared";
import { contentLength, contentType, profilePictureKey } from "../shared/media";
import { userId } from "../shared/user";

const trpcProfileSchema = {
  uploadProfilePictureOpenApi: z.object({
    user: z.string(),
    key: profilePictureKey,
  }),

  updateProfile: z.object({
    name: z.string().max(50),
    username: z.string().max(50),
    bio: z.string().max(160),
  }),

  userProfilePicture: z.object({
    userId,
  }),

  batchProfilePictures: z.object({ userIds: z.array(userId) }),
};

export default trpcProfileSchema;
