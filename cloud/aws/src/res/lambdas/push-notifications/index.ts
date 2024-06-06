import { SnsSchema } from "@aws-lambda-powertools/parser/lib/cjs/schemas/sns";
import { parser } from "@aws-lambda-powertools/parser/middleware";
import middy from "@middy/core";
import eventNormalizerMiddleware from "@middy/event-normalizer";
import httpErrorHandler from "@middy/http-error-handler";
import jsonBodyParser from "@middy/http-json-body-parser";
import type { Context } from "aws-lambda";
import { z } from "zod";

const notificationData = z.object({
  userId: z.string(),
  message: z.string().min(1, "Message is required"),
  timestamp: z.string(),
});

const originalRecordsSchema = SnsSchema.shape.Records.element;

const extendedRecordsSchema = z.object({
  ...originalRecordsSchema.shape,
  Sns: originalRecordsSchema.shape.Sns.extend({
    Message: notificationData,
  }),
});

const extendedSnsSchema = SnsSchema.extend({
  Records: z.array(extendedRecordsSchema),
});

type NotificationData = z.infer<typeof extendedSnsSchema>;

const lambdaHandler = async (
  event: NotificationData,
  _context: Context,
): Promise<void> => {
  for (const record of event.Records) {
    const {} = record.Sns.Message;
  }
};

export const handler = middy(lambdaHandler)
  .use(jsonBodyParser())
  .use(eventNormalizerMiddleware())
  .use(httpErrorHandler())
  .use(parser({ schema: extendedSnsSchema }));
