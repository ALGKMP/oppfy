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
        name: z.string(),
        profilePictureUrl: z.string(),
        privacy: z.enum(["public", "private"]),
        relationshipState: z.enum([
          "following",
          "followRequestSent",
          "notFollowing",
        ]),
        createdAt: z.date(),
      }),
    ),
    nextCursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
  }),

  friendItems: z.array(
    z.object({
      userId: z.string(),
      profileId: z.number(),
      username: z.string(),
      name: z.string(),
      profilePictureUrl: z.string(),
      privacy: z.enum(["public", "private"]),
    }),
  ),
  friendItemsOther: z.array(
    z.object({
      userId: z.string(),
      profileId: z.number(),
      username: z.string(),
      name: z.string(),
      profilePictureUrl: z.string(),
      relationshipState: z.enum([
        "following",
        "followRequestSent",
        "notFollowing",
      ]),
      privacy: z.enum(["public", "private"]),
    }),
  ),
};

export default trpcFriendOutputSchema;
