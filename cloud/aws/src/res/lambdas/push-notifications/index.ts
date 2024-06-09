import { SnsEnvelope } from "@aws-lambda-powertools/parser/envelopes";
import { parser } from "@aws-lambda-powertools/parser/middleware";
import middy from "@middy/core";
import type { Context } from "aws-lambda";
import type { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

const notificationData = sharedValidators.notifications.snsNotificationData;

type NotificationData = z.infer<typeof notificationData>;

const lambdaHandler = async (
  event: NotificationData,
  _context: Context,
): Promise<void> => {
  console.log("Received event:", JSON.stringify(event, null, 2));
};

export const handler = middy(lambdaHandler).use(
  parser({ schema: notificationData, envelope: SnsEnvelope }),
);
