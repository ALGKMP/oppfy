import { SQSClient } from "@aws-sdk/client-sqs";
import { Producer } from "sqs-producer";

import { env } from "@oppfy/env";

export const sqs = Producer.create({
  queueUrl: env.SQS_CONTACT_QUEUE,
  region: env.AWS_REGION,
  sqs: new SQSClient({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  }),
});
