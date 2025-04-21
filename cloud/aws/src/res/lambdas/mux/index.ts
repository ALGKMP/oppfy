import { parser } from "@aws-lambda-powertools/parser/middleware";
import { APIGatewayProxyEventV2Schema } from "@aws-lambda-powertools/parser/schemas";
// import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import middy from "@middy/core";
// import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { db, eq, schema, sql } from "@oppfy/db";
import { Mux } from "@oppfy/mux";
import { SQS } from "@oppfy/sqs";

// type SnsNotificationData = z.infer<typeof validators.snsNotificationData>;

// type StoreNotificationData = z.infer<typeof validators.notificationData>;

// type SendNotificationData = z.infer<typeof validators.sendNotificationData>;

type APIGatewayProxyEvent = z.infer<typeof APIGatewayProxyEventV2Schema>;

const MUX_READY_EVENT = "video.asset.ready";

const mux = new Mux();

const muxPassthroughSchema = z.object({
  postid: z.string(),
});
// const env = createEnv({
//   server: {
//     SNS_PUSH_NOTIFICATION_TOPIC_ARN: z.string().min(1),
//   },
//   runtimeEnv: process.env,
// });

// const sns = new SNSClient({
//   region: "us-east-1",
// });

const muxBodySchema = z
  .object({
    type: z.string(),
    object: z.object({
      id: z.string(),
      type: z.string(),
      error: z.string().optional(),
    }),
    data: z.object({
      aspect_ratio: z.string(),
      playback_ids: z.array(z.object({ id: z.string() })).nonempty(),
      passthrough: z
        .string()
        .transform((str) => muxPassthroughSchema.parse(JSON.parse(str))),
    }),
  })
  .passthrough();

const deleteAsset = async (assetId: string) => {
  await mux.deleteAsset(assetId);
};

const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<void> => {
  const rawBody = event.body;
  const headers = event.headers;

  if (rawBody === undefined) {
    throw new Error("Missing raw body or mux-signature header");
  }

  try {
    mux.verifyWebhookSignature(rawBody, headers);
  } catch {
    throw new Error("Invalid Mux Webhook Signature");
  }

  const body = muxBodySchema.parse(JSON.parse(rawBody));

  // Early return for non-video.asset.ready events
  if (body.type !== MUX_READY_EVENT) {
    console.log(`Ignoring Mux event of type: ${body.type}`);
    return;
  }
  const postId = body.data.passthrough.postid;
  try {
    // transaction to update post status and user stats
    await db.transaction(async (tx) => {
      await tx
        .update(schema.post)
        .set({
          postKey: body.data.playback_ids[0].id,
          status: "processed",
        })
        .where(eq(schema.post.id, postId));

      // Update user stats to increment post count
      await tx
        .update(schema.userStats)
        .set({ posts: sql`${schema.userStats.posts} + 1` })
        .where(
          eq(
            schema.userStats.userId,
            sql`(SELECT recipient_user_id FROM post WHERE id = ${postId})`,
          ),
        );
    });

    // get the post
    const post = await db.query.post.findFirst({
      where: eq(schema.post.id, postId),
    });
    if (!post) {
      throw new Error("Post not found");
    }

    // get username of poster
    const authorProfile = await db.query.profile.findFirst({
      where: eq(schema.profile.userId, post.authorUserId),
    });
    if (!authorProfile) {
      throw new Error("Author profile not found");
    }

    // get profile of poster
    await new SQS().sendPostNotification({
      postId: postId,
      recipientId: post.recipientUserId,
      senderId: post.authorUserId,
      username: authorProfile.username ?? "",
    });


  } catch (error) {
    console.error("Error processing video:", error);
    throw error;
  }
};

export const handler = middy(lambdaHandler).use(
  parser({ schema: APIGatewayProxyEventV2Schema }),
);
