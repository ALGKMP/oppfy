import { z } from "zod";

const trpcRequestOutputSchema = {
  paginateFriendSelf: z.object({
    items: z.object({
      followRequests: z.array(
        z.object({
          userId: z.string(),
          profileId: z.number(),
          username: z.string(),
          name: z.string(),
          profilePictureUrl: z.string(),
        }),
      ),
      friendRequests: z.array(
        z.object({
          userId: z.string(),
          profileId: z.number(),
          username: z.string(),
          name: z.string(),
          profilePictureUrl: z.string(),
        }),
      ),
    }),
    nextCursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
  }),

  countRequests: z.object({
    followRequests: z.number(),
    friendRequests: z.number(),
  }),
};

export default trpcRequestOutputSchema;
