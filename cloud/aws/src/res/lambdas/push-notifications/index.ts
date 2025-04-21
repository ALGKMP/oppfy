import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { SqsEnvelope } from "@aws-lambda-powertools/parser/envelopes";
import { parser } from "@aws-lambda-powertools/parser/middleware";
import middy from "@middy/core";
import { createEnv } from "@t3-oss/env-core";
import type { APIGatewayProxyResult, Context } from "aws-lambda";
import { z } from "zod";

import { and, db, eq, gt, schema } from "@oppfy/db";

// ────────────────────────────────────────────────────────────────────────────
// 1. Runtime configuration & schemas
// ────────────────────────────────────────────────────────────────────────────
const env = createEnv({
  server: { EXPO_ACCESS_TOKEN: z.string().min(1) },
  runtimeEnv: process.env,
});

const NotificationSchema = z.object({
  senderId: z.string(),
  recipientId: z.string(),
  title: z.string(),
  body: z.string(),
  eventType: z.enum(["like", "post", "comment", "follow", "friend"]),
  entityId: z.string(),
  entityType: z.enum(["post", "comment", "profile"]),
});
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationBatch = Notification[];

// ────────────────────────────────────────────────────────────────────────────
// 2. DB helpers
// ────────────────────────────────────────────────────────────────────────────
async function getNotificationSettings(userId: string) {
  return (
    (
      await db
        .select()
        .from(schema.notificationSettings)
        .where(eq(schema.notificationSettings.userId, userId))
        .limit(1)
    )[0] ?? null
  );
}

function isNotificationEnabled(
  event: Notification["eventType"],
  settings: NonNullable<Awaited<ReturnType<typeof getNotificationSettings>>>,
) {
  const map: Record<Notification["eventType"], boolean> = {
    like: settings.likes,
    post: settings.posts,
    comment: settings.comments,
    follow: settings.followRequests,
    friend: settings.friendRequests,
  };
  return map[event];
}

async function hasRecentDuplicate(params: {
  recipientId: string;
  entityId: string;
  entityType: Notification["entityType"];
  eventType: Notification["eventType"];
  minutes: number;
}) {
  const { recipientId, entityId, entityType, eventType, minutes } = params;
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);

  const [row] = await db
    .select({ id: schema.notification.id })
    .from(schema.notification)
    .where(
      and(
        eq(schema.notification.recipientUserId, recipientId),
        eq(schema.notification.entityId, entityId),
        eq(schema.notification.entityType, entityType),
        eq(schema.notification.eventType, eventType),
        gt(schema.notification.createdAt, cutoff),
      ),
    )
    .limit(1);

  return Boolean(row);
}

function storeNotification(n: Notification) {
  return db.insert(schema.notification).values({
    senderUserId: n.senderId,
    recipientUserId: n.recipientId,
    eventType: n.eventType,
    entityId: n.entityId,
    entityType: n.entityType,
  });
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Message builders
// ────────────────────────────────────────────────────────────────────────────
function buildBody(n: Notification, count: number): string {
  const { title, eventType, entityType } = n;

  if (count === 1) {
    return n.body;
  }

  switch (eventType) {
    case "like":
      return `${count} people liked your ${entityType}`;
    case "post":
      return `${count} new posts from people you follow`;
    case "comment":
      return `${count} people commented on your ${entityType}`;
    case "follow":
      return `${count} people followed you`;
    case "friend":
      return `${count} people sent you friend requests`;
  }
}

function buildTitle(eventType: Notification["eventType"], count: number) {
  const plural = count > 1 ? "s" : "";
  switch (eventType) {
    case "like":
      return `New Like${plural}`;
    case "post":
      return `New Post${plural}`;
    case "comment":
      return `New Comment${plural}`;
    case "follow":
      return `New Follower${plural}`;
    case "friend":
      return `New Friend Request${plural}`;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Lambda core
// ────────────────────────────────────────────────────────────────────────────
const lambdaHandler = async (
  event: NotificationBatch,
  _ctx: Context,
): Promise<APIGatewayProxyResult> => {
  const expo = new Expo({ accessToken: env.EXPO_ACCESS_TOKEN });

  // 1. Group notifications by recipient
  const byRecipient = new Map<string, NotificationBatch>();
  for (const n of event) {
    byRecipient.set(n.recipientId, [
      ...(byRecipient.get(n.recipientId) ?? []),
      n,
    ]);
  }

  // 2. Process each recipient concurrently
  await Promise.all(
    [...byRecipient.entries()].map(async ([userId, userNotifs]) => {
      const settings = await getNotificationSettings(userId);
      if (!settings) return;

      const pushTokens = await db
        .select({ token: schema.pushToken.token })
        .from(schema.pushToken)
        .where(eq(schema.pushToken.userId, userId));
      if (pushTokens.length === 0) return;

      // Group by composite key eventType:entityType:entityId
      const groups = new Map<string, NotificationBatch>();
      for (const n of userNotifs) {
        const key = `${n.eventType}:${n.entityType}:${n.entityId}`;
        groups.set(key, [...(groups.get(key) ?? []), n]);
      }

      for (const batch of groups.values()) {
        if (batch.length === 0) continue;
        const first = batch[0]!;
        const { eventType, entityType, entityId } = first;

        if (!isNotificationEnabled(eventType, settings)) continue;
        if (
          await hasRecentDuplicate({
            recipientId: userId,
            entityId,
            entityType,
            eventType,
            minutes: 10,
          })
        )
          continue;

        const count = batch.length;
        const body = buildBody(first, count);
        const title = buildTitle(eventType, count);

        const message: ExpoPushMessage = {
          to: pushTokens.map((t) => t.token),
          sound: "default",
          title,
          body,
          data: { eventType, entityType, entityId },
        };

        // Chunk to respect 100‑token limit / request
        const chunks = expo.chunkPushNotifications([message]);
        for (const chunk of chunks) {
          try {
            const tickets = await expo.sendPushNotificationsAsync(chunk);
            await handleTickets(tickets, chunk);
          } catch (err) {
            console.error("Expo send error", err);
          }
        }

        // Persist every individual notification
        await Promise.all(batch.map(storeNotification));
      }
    }),
  );

  return { statusCode: 200, body: JSON.stringify({ message: "Success" }) };
};

// ────────────────────────────────────────────────────────────────────────────
// 5. Ticket handling & stale‑token cleanup
// ────────────────────────────────────────────────────────────────────────────
async function handleTickets(
  tickets: ExpoPushTicket[],
  chunk: ExpoPushMessage[],
) {
  await Promise.all(
    tickets.map(async (ticket, idx) => {
      if (ticket.status !== "error") return;
      if (ticket.details?.error !== "DeviceNotRegistered") return;

      const to = chunk[idx]?.to;
      const token =
        typeof to === "string" ? to : Array.isArray(to) ? to[0] : null;
      if (!token) return;

      try {
        await db
          .delete(schema.pushToken)
          .where(eq(schema.pushToken.token, token));
      } catch (err) {
        console.error("Failed to delete stale push token", err);
      }
    }),
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 6. Middy wrapper
// ────────────────────────────────────────────────────────────────────────────
export const handler = middy(lambdaHandler).use(
  parser({ schema: NotificationSchema, envelope: SqsEnvelope }),
);
