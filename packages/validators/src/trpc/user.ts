import { z } from "zod";

import { dateOfBirth, fullName, userId, username } from "../shared/user";
import { createInsertSchema } from 'drizzle-zod';
import { schema } from "@acme/db";

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
    posts: z.boolean().optional(),
    mentions: z.boolean().optional(),
    comments: z.boolean().optional(),
    likes: z.boolean().optional(),
    friendRequests: z.boolean().optional(),
  }),
};

export default trpcUserSchema;
