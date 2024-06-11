import { z } from "zod";

const baseNotificationData = z.object({
  title: z.string(),
  body: z.string(),
});

const entityNotificationData = baseNotificationData.extend({
  entityId: z.string(),
  entityType: z.enum(["post", "profile", "comment"]),
});

export const notificationData = z.union([
  baseNotificationData,
  entityNotificationData,
]);

export const snsBaseNotificationData = baseNotificationData.extend({
  pushToken: z.string(),
});

export const snsEntityNotificationData = entityNotificationData.extend({
  pushToken: z.string(),
});

export const snsNotificationData = z.union([
  snsBaseNotificationData,
  snsEntityNotificationData,
]);
