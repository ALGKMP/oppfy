import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    // # AWS Config
    AWS_REGION: z.string().min(1),
    AWS_ACCOUNT_ID: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),

    // # SNS Config
    SNS_PUSH_NOTIFICATION_TOPIC_ARN: z.string().min(1),

    // # SQS Queues
    SQS_CONTACT_QUEUE: z.string().min(1),

    // # S3 Config
    S3_POST_BUCKET: z.string().min(1),
    S3_PROFILE_BUCKET: z.string().min(1),

    // # Mux Config
    MUX_TOKEN_ID: z.string().min(1),
    MUX_TOKEN_SECRET: z.string().min(1),
    MUX_WEBHOOK_SECRET: z.string().min(1),

    // # RDS DB Config
    DATABASE_PORT: z.string().min(1),
    DATABASE_ENDPOINT: z.string().min(1),
    DATABASE_USERNAME: z.string().min(1),
    DATABASE_NAME: z.string().min(1),
    DATABASE_PASSWORD: z.string().min(1),

    // # ElasticSearch Config
    OPENSEARCH_URL: z.string().min(1),

    // # Expo Config
    EXPO_ACCESS_TOKEN: z.string().min(1),
  },
  runtimeEnv: process.env,
});
