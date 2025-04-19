import type { ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { Expo } from "expo-server-sdk";
import { parser } from "@aws-lambda-powertools/parser/middleware";
import { SnsSchema } from "@aws-lambda-powertools/parser/schemas";
import middy from "@middy/core";
import { createEnv } from "@t3-oss/env-core";
import type { APIGatewayProxyResult, Context } from "aws-lambda";
import { z } from "zod";

import { SqsEnvelope } from "@aws-lambda-powertools/parser/envelopes";

import { db, eq, schema } from "@oppfy/db";
import { validators } from "@oppfy/validators";

// const env = createEnv({
//   server: {
//     EXPO_ACCESS_TOKEN: z.string().min(1),
//   },
//   runtimeEnv: process.env,
// });

// const originalRecordsSchema = SnsSchema.shape.Records.element;

// const extendedRecordsSchema = z.object({
//   ...originalRecordsSchema.shape,
//   Sns: originalRecordsSchema.shape.Sns.extend({
//     Message: z.string(),
//   }),
// });

// const extendedSnsSchema = SnsSchema.extend({
//   Records: z.array(extendedRecordsSchema),
// });

// // type EntityData = z.infer<typeof validators.entityData>;
// type NotificationData = z.infer<typeof extendedSnsSchema>;

// const lambdaHandler = async (
//   event: NotificationData,
//   _context: Context,
// ): Promise<void> => {
//   const expo = new Expo({
//     accessToken: env.EXPO_ACCESS_TOKEN,
//   });

//   const messages: ExpoPushMessage[] = [];

//   for (const record of event.Records) {
//     const result = validators.snsNotificationData.safeParse(
//       JSON.parse(record.Sns.Message),
//     );

//     if (!result.success) {
//       throw new Error("Invalid SNS message", result.error);
//     }

//     const { title, body, pushTokens } = result.data;

//     const entityData =
//       "entityId" in result.data && "entityType" in result.data
//         ? ({
//             entityId: result.data.entityId,
//             entityType: result.data.entityType,
//           } satisfies EntityData)
//         : undefined;

//     messages.push({
//       to: pushTokens,
//       sound: "default",
//       title,
//       body,
//       data: entityData,
//     });
//   }

//   const chunks = expo.chunkPushNotifications(messages);

//   for (const chunk of chunks) {
//     try {
//       const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
//       handlePushTickets(ticketChunk, chunk);
//     } catch (error) {
//       console.error(error);
//     }
//   }
// };

// const handlePushTickets = (
//   tickets: ExpoPushTicket[],
//   chunk: ExpoPushMessage[],
// ) => {
//   tickets.forEach((ticket, index) => {
//     if (ticket.status === "ok") return;
//     if (ticket.details === undefined) return;

//     const token = chunk[index]?.to;
//     if (typeof token !== "string") return;

//     switch (ticket.details.error) {
//       case "DeviceNotRegistered":
//         void removeTokenFromDatabase(token);
//         break;
//     }
//   });
// };

// const removeTokenFromDatabase = async (token: string) => {
//   await db.delete(schema.pushToken).where(eq(schema.pushToken.token, token));
// };

// export const handler = middy(lambdaHandler).use(
//   parser({ schema: extendedSnsSchema }),
// );

const contactSyncBody = z.object({
  userId: z.string(),
  userPhoneNumberHash: z.string(),
  contacts: z.array(z.string()),
});

const notificationBody = z.object({
  senderUserId: z.string(),
  receiverUserId: z.string(),
  type: z.enum(["contact"]),
  // TODO: add more details about the notificatio
  message: z.string(),
  createdAt: z.string(),
})


// list bc of middy powertools thing
// 1. Parses data using SqsSchema.
// 2. Parses records in body key using your schema and return them in a list.
type ContactSyncBodyType = z.infer<typeof contactSyncBody>[];

const lambdaHandler = async (
  event: ContactSyncBodyType,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    // check body first
    if (!event[0]) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Malformed request",
        }),
      };
    }


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
  parser({ schema: contactSyncBody, envelope: SqsEnvelope }),
);
