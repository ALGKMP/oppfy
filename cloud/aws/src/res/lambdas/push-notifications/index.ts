import type { ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { Expo } from "expo-server-sdk";
import { SqsEnvelope } from "@aws-lambda-powertools/parser/envelopes";
import { parser } from "@aws-lambda-powertools/parser/middleware";
import middy from "@middy/core";
import { createEnv } from "@t3-oss/env-core";
import type { APIGatewayProxyResult, Context } from "aws-lambda";
import { z } from "zod";

import {
  and,
  db,
  entityTypeEnum,
  eq,
  eventTypeEnum,
  lt,
  schema,
} from "@oppfy/db";
import { validators } from "@oppfy/validators";

const env = createEnv({
  server: {
    EXPO_ACCESS_TOKEN: z.string().min(1),
  },
  runtimeEnv: process.env,
});


const notificationBody = z.object({
  senderId: z.string(),
  recipientId: z.string(),
  title: z.string(),
  body: z.string(),
  eventType: z.enum(["like", "post", "comment", "follow", "friend"]),
  entityId: z.string(),
  entityType: z.enum(["post", "comment", "profile"]),
});

function storeNotification(params: typeof notificationBody._type) {
  db.insert(schema.notification).values({
    senderUserId: params.senderId,
    recipientUserId: params.recipientId,
    eventType: params.eventType,
    entityId: params.entityId,
    entityType: params.entityType,
  });
}

async function getRecentNotifications(params: {
  senderId: string;
  recipientId: string;
  entityId: string;
  entityType: (typeof entityTypeEnum.enumValues)[number];
  eventType: (typeof eventTypeEnum.enumValues)[number];
  minutesThreshold: number;
  limit: number;
}) {
  const {
    senderId,
    recipientId,
    entityId,
    entityType,
    eventType,
    minutesThreshold,
    limit,
  } = params;

  const notifications = await db
    .select()
    .from(schema.notification)
    .where(
      and(
        eq(schema.notification.senderUserId, senderId),
        eq(schema.notification.recipientUserId, recipientId),
        eq(schema.notification.eventType, eventType),
        eq(schema.notification.entityId, entityId),
        eq(schema.notification.entityType, entityType),
        lt(
          schema.notification.createdAt,
          new Date(Date.now() - minutesThreshold * 60 * 1000),
        ),
      ),
    )
    .limit(limit);
  return notifications;
}

// funciton to get notfication settings
async function getNotificationSettings(userId: string) {
  const settings = await db
    .select()
    .from(schema.notificationSettings)
    .where(eq(schema.notificationSettings.userId, userId))
    .limit(1);
  return settings[0];
}

function isNotificationEnabled(
  notificationType: (typeof eventTypeEnum.enumValues)[number],
  settings: NonNullable<Awaited<ReturnType<typeof getNotificationSettings>>>,
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
}

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

// list bc of middy powertools thing
// 1. Parses data using SqsSchema.
// 2. Parses records in body key using your schema and return them in a list.
type NotificationBodyType = z.infer<typeof notificationBody>[];

const lambdaHandler = async (
  event: NotificationBodyType,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  try {

    const expo = new Expo({
      accessToken: env.EXPO_ACCESS_TOKEN,
    });

    console.log(event);

    const notification = event[0];

    if (!notification) {
      console.log("No notification found");
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid request",
        }),
      };
    }

    const {
      senderId,
      recipientId,
      title,
      body,
      eventType,
      entityId,
      entityType,
    } = notification;

    const notificationSettings = await getNotificationSettings(recipientId);
    if (!notificationSettings) {
      console.log("Notification settings not found");
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid request",
        }),
      };
    }

    if (!isNotificationEnabled(eventType, notificationSettings)) {
      console.log("Notification disabled");
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid request",
        }),
      };
    }

    const recentNotifications = await getRecentNotifications({
      senderId,
      recipientId,
      entityId,
      entityType,
      eventType,
      minutesThreshold: 1,
      limit: 1,
    });
    if (recentNotifications.length > 0) {
      console.log("Recent notifications found");
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid request",
        }),
      };
    }
    storeNotification(notification);

    const messages: ExpoPushMessage[] = [];
    const pushTokens = await db
      .select({
        token: schema.pushToken.token,
      })
      .from(schema.pushToken)
      .where(eq(schema.pushToken.userId, recipientId));

    if (pushTokens.length === 0) {
      console.log("No push tokens found");
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid request",
        }),
      };
    }

    messages.push({
      to: pushTokens.map((token) => token.token),
      sound: "default",
      title,
      body,
      data: {
        senderId,
        recipientId,
        title,
        body,
        eventType,
        entityId,
        entityType,
      },
    });

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        handlePushTickets(ticketChunk, chunk);
      } catch (error) {
        console.error(error);
      }
    }

    console.log("Notifications sent");

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

const handlePushTickets = (
  tickets: ExpoPushTicket[],
  chunk: ExpoPushMessage[],
) => {
  tickets.forEach((ticket, index) => {
    if (ticket.status === "ok") return;
    if (ticket.details === undefined) return;

    const token = chunk[index]?.to;
    if (typeof token !== "string") return;

    switch (ticket.details.error) {
      case "DeviceNotRegistered":
        void removeTokenFromDatabase(token);
        break;
    }
  });
};

const removeTokenFromDatabase = async (token: string) => {
  await db.delete(schema.pushToken).where(eq(schema.pushToken.token, token));
};

export const handler = middy(lambdaHandler).use(
  parser({ schema: notificationBody, envelope: SqsEnvelope }),
);
