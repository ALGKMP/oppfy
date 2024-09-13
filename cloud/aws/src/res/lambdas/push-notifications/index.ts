import type {
  ExpoPushMessage,
  ExpoPushTicket,
} from "expo-server-sdk";
import { Expo } from "expo-server-sdk";
import { parser } from "@aws-lambda-powertools/parser/middleware";
import { SnsSchema } from "@aws-lambda-powertools/parser/schemas";
import middy from "@middy/core";
import { createEnv } from "@t3-oss/env-core";
import type { Context } from "aws-lambda";
import { z } from "zod";

import { sharedValidators } from "@oppfy/validators";
import { db, eq, schema } from "@oppfy/db";

const env = createEnv({
  server: {
    EXPO_ACCESS_TOKEN: z.string().min(1),
  },
  runtimeEnv: process.env,
});

const originalRecordsSchema = SnsSchema.shape.Records.element;

const extendedRecordsSchema = z.object({
  ...originalRecordsSchema.shape,
  Sns: originalRecordsSchema.shape.Sns.extend({
    Message: z.string(),
  }),
});

const extendedSnsSchema = SnsSchema.extend({
  Records: z.array(extendedRecordsSchema),
});

type EntityData = z.infer<typeof sharedValidators.notifications.entityData>;
type NotificationData = z.infer<typeof extendedSnsSchema>;

const lambdaHandler = async (
  event: NotificationData,
  _context: Context,
): Promise<void> => {
  const expo = new Expo({
    accessToken: env.EXPO_ACCESS_TOKEN,
  });

  const messages: ExpoPushMessage[] = [];

  for (const record of event.Records) {
    const result = sharedValidators.notifications.snsNotificationData.safeParse(
      JSON.parse(record.Sns.Message),
    );

    if (!result.success) {
      throw new Error("Invalid SNS message", result.error);
    }

    const { title, body, pushTokens } = result.data;

    const entityData =
      "entityId" in result.data && "entityType" in result.data
        ? ({
            entityId: result.data.entityId,
            entityType: result.data.entityType,
          } satisfies EntityData)
        : undefined;

    messages.push({
      to: pushTokens,
      sound: "default",
      title,
      body,
      data: entityData,
    });
  }

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      handlePushTickets(ticketChunk, chunk)
    } catch (error) {
      console.error(error);
    }
  }
};

const handlePushTickets =  (
  tickets: ExpoPushTicket[],
  chunk: ExpoPushMessage[],
) => {
  tickets.forEach( (ticket, index) => {
    if (ticket.status === "ok") return
    if (ticket.details === undefined) return;

    const token = chunk[index]?.to;
    if (typeof token !== "string") return;

    switch (ticket.details.error) {
      case "DeviceNotRegistered":
        void removeTokenFromDatabase(token)
        break;
    }
  });
};

const removeTokenFromDatabase = async (token: string) => {
  await db.delete(schema.pushToken).where(
    eq(schema.pushToken.token, token),
  );
};

export const handler = middy(lambdaHandler).use(
  parser({ schema: extendedSnsSchema }),
);
