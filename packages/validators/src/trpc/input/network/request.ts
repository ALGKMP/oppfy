import { z } from "zod";

const trpcRequestInputSchema = {
  paginateFriendRequests: z.object({
    cursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
    pageSize: z.number().optional(),
  }),

  paginateFollowRequests: z.object({
    cursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
    pageSize: z.number().optional(),
  }),

  sendFriendRequest: z.object({
    recipientId: z.string(),
  }),

  cancelFriendRequest: z.object({
    recipientId: z.string(),
  }),

  acceptFriendRequest: z.object({
    senderId: z.string(),
  }),

  rejectFriendRequest: z.object({
    senderId: z.string(),
  }),

  acceptFollowRequest: z.object({
    senderId: z.string(),
  }),

  rejectFollowRequest: z.object({
    senderId: z.string(),
  }),

  cancelFollowRequest: z.object({
    recipientId: z.string(),
  }),
};

export default trpcRequestInputSchema;
