import { z } from "zod";

const trpcNotificationsInputSchema = {
  getNotifications: z.object({
    limit: z.number().int().positive().default(10),
    cursor: z.string().optional(),
  }),

  updateNotificationSettings: z.object({
    posts: z.boolean().optional(),
    likes: z.boolean().optional(),
    mentions: z.boolean().optional(),
    comments: z.boolean().optional(),
    followRequests: z.boolean().optional(),
    friendRequests: z.boolean().optional(),
  }),
};

export default trpcNotificationsInputSchema;