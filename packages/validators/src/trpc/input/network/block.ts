import { z } from "zod";

const trpcBlockInputSchema = {
  blockUser: z.object({
    blockUserId: z.string(),
  }),

  unblockUser: z.object({
    blockedUserId: z.string(),
  }),

  isUserBlocked: z.object({
    userId: z.string(),
    blockedUserId: z.string(),
  }),

  paginateBlockedUsers: z.object({
    cursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
    pageSize: z.number().optional(),
  }),
};

export default trpcBlockInputSchema;
