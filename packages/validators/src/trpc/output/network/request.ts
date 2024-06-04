import { z } from "zod";

const trpcRequestOutputSchema = {
  paginateFriendRequests: z.object({
    items: z.array(
      z.object({
        userId: z.string(),
        username: z.string(),
        name: z.string(),
        profileId: z.number(),
        profilePictureUrl: z.string(),
        friendRequestId: z.number(),
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

  paginateFollowRequests: z.object({
    items: z.array(
      z.object({
        userId: z.string(),
        username: z.string(),
        name: z.string(),
        profileId: z.number(),
        profilePictureUrl: z.string(),
        followRequestId: z.number(),
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

  countRequests: z.object({
    followRequestCount: z.number(),
    friendRequestCount: z.number(),
  }),
};

export default trpcRequestOutputSchema;
