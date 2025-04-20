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
  not,
  schema,
} from "@oppfy/db";

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

    // group notis by [eventtype][entityType][userId]
    // for each notification, check if notification is enabled
    // if enabled, check if notification is recent
    // if recent, skip
    // if not recent, send notification
    // if not enabled, skip

    const notifications = event;
    if (!notifications) {
      console.log("No notifications found");
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid request",
        }),
      };
    }

    const things = notifications.reduce((acc, item) => {
      const { eventType, entityType, recipientId } = item;
      if (!acc.has(eventType)) {
        acc.set(eventType, new Map());
      }
      if (!acc.get(eventType)!.has(entityType)) {
        acc.get(eventType)!.set(entityType, new Map());
      }
      if (!acc.get(eventType)!.get(entityType)!.has(recipientId)) {
        acc.get(eventType)!.get(entityType)!.set(recipientId, [item]);
      }
      // acc.get(eventType)!.get(entityType)!.get(recipientId)!.push(item);
      return acc;
    }, new Map<string, Map<string, Map<string, NotificationBodyType>>>());
    


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
