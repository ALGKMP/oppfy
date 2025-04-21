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
  // senderId: string;
  recipientId: string;
  entityId: string;
  entityType: (typeof entityTypeEnum.enumValues)[number];
  eventType: (typeof eventTypeEnum.enumValues)[number];
  minutesThreshold: number;
  limit: number;
}) {
  const {
    // senderId,
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
        // eq(schema.notification.senderUserId, senderId),
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

    // group notis by [eventtype][entityType][entityId][recipientId]
    // group notis by [{eventType, entityType, entityId, recipientId}]
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

    // group by user id, so a dict of userId -> [notifications]
    const notificationsByUser = notifications.reduce((acc, item) => {
      const { recipientId } = item;
      acc.set(
        recipientId,
        acc.get(recipientId) ? [...acc.get(recipientId)!, item] : [item],
      );
      return acc;
    }, new Map<string, NotificationBodyType>());

    for (const [userId, notifications] of notificationsByUser) {
      const settings = await getNotificationSettings(userId);

      if (!settings) {
        console.log("No settings found");
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Invalid request",
          }),
        };
      }

      const pushTokens = await db
        .select({ token: schema.pushToken.token })
        .from(schema.pushToken)
        .where(eq(schema.pushToken.userId, userId));

      if (pushTokens.length === 0) {
        console.log("No push tokens found");
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Invalid request",
          }),
        };
      }

      // group by event type and entity id
      const notificationsByEventTypeAndEntityId = notifications.reduce(
        (acc, item) => {
          const { eventType, entityType, entityId } = item;
          acc.set(
            { eventType, entityType, entityId },
            acc.get({ eventType, entityType, entityId })
              ? [...acc.get({ eventType, entityType, entityId })!, item]
              : [item],
          );
          return acc;
        },
        new Map<
          {
            eventType: (typeof notificationBody._type)["eventType"];
            entityType: (typeof notificationBody._type)["entityType"];
            entityId: string;
          },
          NotificationBodyType
        >(),
      );

      for (const [
        { eventType, entityType, entityId },
        notifications,
      ] of notificationsByEventTypeAndEntityId) {
        // aggregate notis if there are multiple
        if (notifications.length > 1) {
          const recentNotifications = await getRecentNotifications({
            recipientId: userId,
            entityId,
            entityType:
              entityType as (typeof notificationBody._type)["entityType"],
            eventType:
              eventType as (typeof notificationBody._type)["eventType"],
            minutesThreshold: 10,
            limit: notifications.length,
          });

          if (recentNotifications.length > 0) {
            console.log("Notification already sent");
            continue;
          }
          let message = "";
          if (notifications.length === 1) {
            // Single notification case
            const notification = notifications[0];
            if (!notification) {
              console.log("No notification found");
              continue;
            }

            switch (eventType) {
              case "like":
                message = `${notification.title} liked your ${entityType}`;
                break;
              case "post":
                message = `${notification.title} made a new post`;
                break;
              case "comment":
                message = `${notification.title} commented on your ${entityType}`;
                break;
              case "follow":
                message = `${notification.title} followed you`;
                break;
              case "friend":
                message = `${notification.title} sent you a friend request`;
                break;
            }
          } else {
            // Multiple notifications case
            switch (eventType) {
              case "like":
                message = `${notifications.length} people liked your ${entityType}`;
                break;
              case "post":
                message = `${notifications.length} new posts from people you follow`;
                break;
              case "comment":
                message = `${notifications.length} people commented on your ${entityType}`;
                break;
              case "follow":
                message = `${notifications.length} people followed you`;
                break;
              case "friend":
                message = `${notifications.length} people sent you friend requests`;
                break;
            }
          }

          // Send push notification
          const pushMessage: ExpoPushMessage = {
            to: pushTokens.map((token) => token.token),
            sound: "default",
            title: message,
            body: message,
            data: {
              eventType,
              entityType,
              entityId,
            },
          };
          const chunks = expo.chunkPushNotifications([pushMessage]);
          for (const chunk of chunks) {
            try {
              const tickets = await expo.sendPushNotificationsAsync(chunk);
              handlePushTickets(tickets, chunk);
            } catch (error) {
              console.error(error);
            }
          }
        } else {
          const notification = notifications[0];
          if (!notification) {
            console.log("No notification found");
            continue;
          }

          const recentNotifications = await getRecentNotifications({
            recipientId: userId,
            entityId,
            entityType:
              entityType as (typeof notificationBody._type)["entityType"],
            eventType:
              eventType as (typeof notificationBody._type)["eventType"],
            minutesThreshold: 10,
            limit: 1,
          });

          if (recentNotifications.length > 0) {
            console.log("Notification already sent");
            continue;
          }

          // Send push notification
          const pushMessage: ExpoPushMessage = {
            to: pushTokens.map((token) => token.token),
            sound: "default",
            title: notification.title,
            body: notification.body,
            data: {
              eventType,
              entityType,
              entityId,
            },
          };

          const chunks = expo.chunkPushNotifications([pushMessage]);
          for (const chunk of chunks) {
            try {
              const tickets = await expo.sendPushNotificationsAsync(chunk);
              handlePushTickets(tickets, chunk);
            } catch (error) {
              console.error(error);
            }
          }
        }
      }
    }

    // const things = notifications.reduce((acc, item) => {
    //   const { eventType, entityType, entityId, recipientId } = item;
    //   acc.set(
    //     { eventType, entityType, entityId },
    //     acc.get({ eventType, entityType, entityId })
    //       ? [...acc.get({ eventType, entityType, entityId })!, item]
    //       : [item],
    //   );

    //   return acc;
    // }, new Map<{ eventType: string; entityType: string; entityId: string, recepientId }, NotificationBodyType>());

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
