import { z } from "zod";

export const entityData = z.object({
  entityId: z.string(),
  entityType: z.enum(["post", "profile", "comment"]),
});

export const baseNotificationData = z.object({
  title: z.string(),
  body: z.string(),
});

export const entityNotificationData = baseNotificationData.merge(entityData);

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
