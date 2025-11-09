import { parser } from "@aws-lambda-powertools/parser/middleware";
import { APIGatewayProxyEventV2Schema } from "@aws-lambda-powertools/parser/schemas";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import middy from "@middy/core";
import { createEnv } from "@t3-oss/env-core";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { z } from "zod";

import { Mux } from "@oppfy/mux";

const REGION = process.env.AWS_REGION ?? "us-east-1";
const MAX_DURATION_SECONDS = 60;
const SAMPLE_RATE_SECONDS = 1;

const sqs = new SQSClient({ region: REGION });
const mux = new Mux();

const muxPassthroughSchema = z.object({
  postid: z.string().uuid(),
});

const muxBodySchema = z
  .object({
    type: z.string(),
    object: z.object({
      id: z.string(),
      type: z.string(),
    }),
    data: z.object({
      duration: z.number().optional(),
      playback_ids: z.array(z.object({ id: z.string() })).nonempty(),
      passthrough: z
        .string()
        .transform((raw) => muxPassthroughSchema.parse(JSON.parse(raw))),
      id: z.string(),
    }),
  })
  .passthrough();

const env = createEnv({
  server: {
    MODERATION_QUEUE_URL: z.string().min(1),
  },
  runtimeEnv: process.env,
});

const MUX_READY_EVENT = "video.asset.ready";

const buildTimestamps = (durationSeconds: number) => {
  const capped = Math.max(
    1,
    Math.min(MAX_DURATION_SECONDS, Math.ceil(durationSeconds)),
  );

  return Array.from({ length: capped }, (_, index) => {
    if (durationSeconds <= 1) {
      return 0;
    }

    const raw = index * SAMPLE_RATE_SECONDS;
    const upperBound = Math.max(durationSeconds - 0.1, 0);
    return Math.min(raw, upperBound);
  });
};

const ensureDuration = async (assetId: string, duration?: number) => {
  if (typeof duration === "number" && duration > 0) {
    return duration;
  }

  const asset = (await mux.getAsset(assetId)) as unknown as {
    data?: { duration?: number };
  };

  if (!asset?.data?.duration) {
    throw new Error(`Mux asset ${assetId} missing duration`);
  }

  return asset.data.duration;
};

const lambdaHandler = async (event: APIGatewayProxyEventV2): Promise<void> => {
  if (!event.body) {
    throw new Error("Missing webhook body");
  }

  mux.verifyWebhookSignature(
    event.body,
    event.headers as Record<string, string>,
  );

  const body = muxBodySchema.parse(JSON.parse(event.body));

  if (body.type !== MUX_READY_EVENT) {
    console.log(`Ignoring Mux event type ${body.type}`);
    return;
  }

  const playbackId = body.data.playback_ids[0]?.id;
  if (!playbackId) {
    throw new Error("Mux playback ID missing in webhook payload");
  }

  const assetId = body.data.id ?? body.object.id;
  const postId = body.data.passthrough.postid;

  const durationSeconds = await ensureDuration(assetId, body.data.duration);
  const timestamps = buildTimestamps(durationSeconds);

  console.log(
    `Enqueueing video moderation for asset ${assetId} with ${timestamps.length} frames`,
  );

  // Send only metadata - moderation lambda will fetch thumbnails in parallel
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: env.MODERATION_QUEUE_URL,
      MessageBody: JSON.stringify({
        type: "video",
        assetId,
        playbackId,
        postId,
        timestamps,
        durationSec: durationSeconds,
      }),
    }),
  );
};

export const handler = middy(lambdaHandler).use(
  parser({ schema: APIGatewayProxyEventV2Schema }),
);
