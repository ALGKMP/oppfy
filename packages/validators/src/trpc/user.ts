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
    mentions: z.boolean().optional(),
    comments: z.boolean().optional(),
    likes: z.boolean().optional(),
    friendRequests: z.boolean().optional(),
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
    userId,
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
