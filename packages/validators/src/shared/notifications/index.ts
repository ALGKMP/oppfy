import { z } from "zod";

export const entityType = z.enum(["post", "profile", "comment"]);
export const eventType = z.enum([
  "like",
  "post",
  "comment",
  "follow",
  "friend",
]);

export const entityData = z.object({
  entityId: z.string(),
  entityType,
});

const baseStoreNotificationData = z.object({
  eventType,
});

const entityStoreNotificationData = baseStoreNotificationData.merge(entityData);

export const notificationData = z.union([
  entityStoreNotificationData,
  baseStoreNotificationData,
]);

const baseSendNotificationData = z.object({
  title: z.string(),
  body: z.string(),
});

const entitySendNotificationData = baseSendNotificationData.extend({
  entityId: z.string(),
  entityType,
});

export const sendNotificationData = z.union([
  entitySendNotificationData,
  baseSendNotificationData,
]);

const extraData = z.object({
  pushTokens: z.array(z.string()),
  senderId: z.string(),
  recipientId: z.string(),
});

const baseSnsNotificationData = baseSendNotificationData.merge(extraData);
const entitySnsNotificationData = entitySendNotificationData.merge(extraData);

export const snsNotificationData = z.union([
  entitySnsNotificationData,
  baseSnsNotificationData,
]);

export const updateNotificationSettings = z.object({
  posts: z.boolean().optional(),
  likes: z.boolean().optional(),
  mentions: z.boolean().optional(),
  comments: z.boolean().optional(),
  followRequests: z.boolean().optional(),
  friendRequests: z.boolean().optional(),
});
