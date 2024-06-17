import { SQSClient } from "@aws-sdk/client-sqs";
import { Producer } from "sqs-producer";

export const sqs = Producer.create({
  queueUrl: process.env.SQS_CONTACT_QUEUE!,
  region: process.env.AWS_REGION!,
  sqs: new SQSClient({
    region: process.env.AWS_REIGON!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }),
});
