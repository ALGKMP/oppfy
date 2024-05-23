import { z } from "zod";

import { PrivacyStatus } from "../profile/profile";

const trpcFollowOutputSchema = {
  paginateFollowersSelf: z.object({
    items: z.array(
      z.object({
        userId: z.string(),
        username: z.string(),
        name: z.string(),
        profilePictureUrl: z.string(),
      }),
    ),
    nextCursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
  }),

  paginateFollowersOthers: z.object({
    items: z.array(
      z.object({
        userId: z.string(),
        username: z.string(),
        privacy: z.enum(["public", "private"]).optional(),
        name: z.string(),
        profilePictureUrl: z.string(),
        isFollowing: z.boolean().optional(),
      }),
    ),
    nextCursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
  }),

  paginateFollowingSelf: z.object({
    items: z.array(
      z.object({
        userId: z.string(),
        username: z.string(),
        name: z.string(),
        profilePictureUrl: z.string(),
      }),
    ),
    nextCursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
  }),

  paginateFollowingOthers: z.object({
    items: z.array(
      z.object({
        userId: z.string(),
        username: z.string(),
        privacy: z.enum(["public", "private"]).optional(),
        name: z.string(),
        profilePictureUrl: z.string(),
        isFollowing: z.boolean().optional(),
      }),
    ),
    nextCursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
  }),
};

export default trpcFollowOutputSchema;
