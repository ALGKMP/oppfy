import type { ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { Expo } from "expo-server-sdk";
import { SqsEnvelope } from "@aws-lambda-powertools/parser/envelopes";
import { parser } from "@aws-lambda-powertools/parser/middleware";
import { SnsSchema } from "@aws-lambda-powertools/parser/schemas";
import middy from "@middy/core";
import { createEnv } from "@t3-oss/env-core";
import type { APIGatewayProxyResult, Context } from "aws-lambda";
import { z } from "zod";

import { db, entityTypeEnum, eq, eventTypeEnum, schema } from "@oppfy/db";
import { validators } from "@oppfy/validators";

/* async storeNotification(
  params: SendNotificationParams,
  db: DatabaseOrTransaction = this.db,
) {
  db.insert(this.schema.notification).values({
    senderUserId: params.senderId,
    recipientUserId: params.recipientId,
    eventType: params.eventType,
    entityId: params.entityId,
    entityType: params.entityType,
  });
} */

/* async getRecentNotifications(
  {
    senderId,
    recipientId,
    entityId,
    entityType,
    eventType,
    minutesThreshold,
    limit,
  }: GetRecentNotificationsParams,
  db: DatabaseOrTransaction = this.db,
): Promise<Notification[]> {
  const notifications = await db
    .select()
    .from(this.schema.notification)
    .where(
      and(
        eq(this.schema.notification.senderUserId, senderId),
        eq(this.schema.notification.recipientUserId, recipientId),
        eq(this.schema.notification.eventType, eventType),
        eq(this.schema.notification.entityId, entityId),
        eq(this.schema.notification.entityType, entityType),
        lt(
          this.schema.notification.createdAt,
          new Date(Date.now() - minutesThreshold * 60 * 1000),
        ),
      ),
    )
    .limit(limit);
  return notifications;
} */

/* isNotificationEnabled(
  notificationType: EventType,
  settings: NotificationSettings,
): boolean {
  switch (notificationType) {
    case "like":
      return settings.likes;
    case "post":
      return settings.posts;
    case "comment":
      return settings.comments;
    case "follow":
      return settings.followRequests;
    case "friend":
      return settings.friendRequests;
  }
} */

// export interface SendNotificationParams {
//   senderId: string;
//   recipientId: string;
//   title: string;
//   body: string;
//   eventType: EventType;
//   entityId: string;
//   entityType: EntityType;
// }

/**
   * 
   * export const eventTypeEnum = pgEnum("event_type", [
  "like",
  "post",
  "comment",
  "follow",
  "friend",
]);
   */
// type EventType = (typeof eventTypeEnum.enumValues)[number];
// type EntityType = (typeof entityTypeEnum.enumValues)[number];

const notificationBody = z.object({
  senderId: z.string(),
  recipientId: z.string(),
  title: z.string(),
  body: z.string(),
  eventType: z.enum(["like", "post", "comment", "follow", "friend"]),
  entityId: z.string(),
  entityType: z.enum(["post", "comment", "profile"]),
});

// list bc of middy powertools thing
// 1. Parses data using SqsSchema.
// 2. Parses records in body key using your schema and return them in a list.
type NotificationBodyType = z.infer<typeof notificationBody>[];

const lambdaHandler = async (
  event: NotificationBodyType,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log(event);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Success",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};

export const handler = middy(lambdaHandler).use(
  parser({ schema: notificationBody, envelope: SqsEnvelope }),
);
