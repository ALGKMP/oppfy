import { z } from "zod";

const trpcFriendOutputSchema = {
  paginateFriendSelf: z.object({
    items: z.array(
      z.object({
        userId: z.string(),
        profileId: z.number(),
        username: z.string(),
        name: z.string(),
        profilePictureUrl: z.string(),
        isFollowing: z.boolean(),
        privacy: z.enum(["public", "private"]),
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
        profileId: z.number(),
        username: z.string(),
        privacy: z.enum(["public", "private"]),
        name: z.string(),
        profilePictureUrl: z.string(),
        isFollowing: z.boolean(),
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
