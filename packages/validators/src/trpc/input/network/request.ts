import { z } from "zod";

const trpcRequestInputSchema = {
  sendFriendRequest: z.object({
    recipientId: z.string(),
  }),

  acceptFriendRequest: z.object({
    senderId: z.string(),
  }),

  rejectFriendRequest: z.object({
    senderId: z.string(),
  }),

  cancelFriendRequest: z.object({
    recipientId: z.string(),
  }),

  acceptFollowRequest: z.object({
    userId: z.string(),
  }),

  rejectFollowRequest: z.object({
    userId: z.string(),
  }),

  cancelFollowRequest: z.object({
    userId: z.string(),
  }),
};

export default trpcRequestInputSchema;
