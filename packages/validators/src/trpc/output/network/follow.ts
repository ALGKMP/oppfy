import { z } from "zod";

const trpcFollowOutputSchema = {
  paginateFollowersSelf: z.object({
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

  paginateFollowersOthers: z.object({
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

  paginateFollowingSelf: z.object({
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

export default trpcFollowOutputSchema;
