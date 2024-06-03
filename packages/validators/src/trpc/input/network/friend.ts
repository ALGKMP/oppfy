import { z } from "zod";

const friendInputSchema = {
  addFriend: z.object({
    userId: z.string(),
  }),

  removeFriend: z.object({
    recipientId: z.string(),
  }),

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

  paginateFriendsSelf: z.object({
    cursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
    pageSize: z.number().optional(),
  }),

  paginateFriendsOther: z.object({
    userId: z.string(),
    cursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
    pageSize: z.number().optional(),
  }),
};

export default friendInputSchema;
