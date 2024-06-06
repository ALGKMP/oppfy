import { z } from "zod";

const trpcNotificationsInputSchema = {
  storePushToken: z.object({
    pushToken: z.string(),
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
