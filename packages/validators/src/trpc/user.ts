import { z } from "zod";

import { dateOfBirth, fullName, userId, username } from "../shared/user";

const trpcUserSchema = {
  updateName: z.object({
    fullName,
  }),
  updateUsername: z.object({
    username,
  }),
  updateDateOfBirth: z.object({
    dateOfBirth,
  }),
  userComplete: z.object({
    userId,
  }),
  updateNotificationSettings: z.object({
    posts: z.boolean().optional(),
    likes: z.boolean().optional(),
    mentions: z.boolean().optional(),
    comments: z.boolean().optional(),
    followRequests: z.boolean().optional(),
    friendRequests: z.boolean().optional(),
  }),
  updatePrivacySetting: z.object({
    privacy: z.enum(["public", "private"]),
  }),

  paginate: z.object({
    cursor: z.object({
      createdAt: z.date(),
      profileId: z.number(),
    }).optional(),
    pageSize: z.number().optional(),
  }),

  paginateOtherUser: z.object({
    userId: z.string(),
    cursor: z.object({
      createdAt: z.date(),
      profileId: z.number(),
    }).optional(),
    pageSize: z.number().optional(),
  }),

  getFriends: z.object({
    userId,
  }),
  getFollowers: z.object({
    userId,
  }),
  getFollowing: z.object({
    userId,
  }),
  blockUser: z.object({
    blockedUserId: userId,
  }),
  isUserBlocked: z.object({
    userId,
    blockedUserId: userId,
  }),
  unblockUser: z.object({
    blockedUserId: userId,
  }),
  follow: z.object({
    recipientId: userId
  }),
  friendRequest: z.object({
    recipientId: userId,
  }),
};

export default trpcUserSchema;
