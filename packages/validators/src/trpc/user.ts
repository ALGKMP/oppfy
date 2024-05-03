import { z } from "zod";

import {
  dateOfBirth,
  fullName,
  userId,
  username,
} from "../shared/user";

const trpcUserSchema = {
  userId,
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
    posts: z.boolean(),
    mentions: z.boolean(),
    comments: z.boolean(),
    likes: z.boolean(),
    friendRequests: z.boolean(),
  }),
};

export default trpcUserSchema;
