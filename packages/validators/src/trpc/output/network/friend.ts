import { z } from "zod";

import { PrivacyStatus } from "../profile/profile";

const trpcFriendOutputSchema = {
  paginateFriendSelf: z.object({
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

  paginateFriendsOthers: z.object({
    items: z.array(
      z.object({
        userId: z.string(),
        username: z.string(),
        name: z.string(),
        profilePictureUrl: z.string(),
        networkStatus: PrivacyStatus,
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

export default trpcFriendOutputSchema;
