import { z } from "zod";

const trpcFollowOutputSchema = {
  paginateFollowersSelf: z.object({
    items: z.array(
      z.object({
        userId: z.string(),
        profileId: z.number(),
        name: z.string(),
        username: z.string(),
        profilePictureUrl: z.string(),
        privacy: z.enum(["public", "private"]),
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

  paginateFollowersOthers: z.object({
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

  paginateFollowingOthers: z.object({
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

  isFollowingSelf: z.boolean(),
};

export default trpcFollowOutputSchema;
