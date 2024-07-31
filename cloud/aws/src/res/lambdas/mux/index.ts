import { parser } from "@aws-lambda-powertools/parser/middleware";
import { APIGatewayProxyEventV2Schema } from "@aws-lambda-powertools/parser/schemas";
import middy from "@middy/core";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { db, eq, schema } from "@oppfy/db";
import { mux } from "@oppfy/mux";
import { PublishCommand, sns } from "@oppfy/sns";
import { sharedValidators } from "@oppfy/validators";

type SnsNotificationData = z.infer<
  typeof sharedValidators.notifications.snsNotificationData
>;

type StoreNotificationData = z.infer<
  typeof sharedValidators.notifications.notificationData
>;

type SendNotificationData = z.infer<
  typeof sharedValidators.notifications.sendNotificationData
>;

type APIGatewayProxyEvent = z.infer<typeof APIGatewayProxyEventV2Schema>;

const env = createEnv({
  server: {
    SNS_PUSH_NOTIFICATION_TOPIC_ARN: z.string().min(1),
  },
  runtimeEnv: process.env,
});

const sendNotification = async (
  pushTokens: string[],
  senderId: string,
  recipientId: string,
  notificationData: SendNotificationData,
) => {
  const message = {
    senderId,
    recipientId,
    pushTokens,
    ...notificationData,
  } satisfies SnsNotificationData;
  const params = {
    Subject: "New notification",
    TopicArn: env.SNS_PUSH_NOTIFICATION_TOPIC_ARN,
    Message: JSON.stringify(message),
  };
  await sns.send(new PublishCommand(params));
};

const storeNotification = async (
  senderId: string,
  recipientId: string,
  notificationData: StoreNotificationData,
) => {
  await db.insert(schema.notifications).values({
    senderId,
    recipientId,
    ...notificationData,
  });
};

const getProfile = async (userId: string) => {
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, userId),
    with: {
      profile: true,
    },
  });

  if (user === undefined) {
    throw new Error("User not found");
  }

  return user.profile;
};

const getNotificationSettings = async (userId: string) => {
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, userId),
    with: {
      notificationSettings: true,
    },
  });

  if (user === undefined) {
    throw new Error("User not found");
  }

  return user.notificationSettings;
};

const getPushTokens = async (userId: string) => {
  const possiblePushTokens = await db.query.pushToken.findMany({
    where: eq(schema.pushToken.userId, userId),
    columns: {
      token: true,
    },
  });

  return possiblePushTokens.map((token) => token.token);
};

const muxBodySchema = z
  .object({
    type: z.literal("video.asset.ready"),
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
        .transform((str) =>
          sharedValidators.aws.metadataSchema.parse(JSON.parse(str)),
        ),
    }),
  })
  .passthrough();

const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<void> => {
  const rawBody = event.body;
  const headers = event.headers;

  if (rawBody === undefined) {
    throw new Error("Missing raw body or mux-signature header");
  }

  try {
    mux.webhooks.verifySignature(rawBody, headers);
  } catch {
    throw new Error("Invalid Mux Webhook Signature");
  }

  const body = muxBodySchema.parse(JSON.parse(rawBody));

  const key = body.data.playback_ids[0].id;
  const metadata = body.data.passthrough;

  const data = {
    key,
    mediaType: "video" as const,
    author: metadata.author,
    height: parseInt(metadata.height),
    width: parseInt(metadata.width),
    caption: metadata.caption,
  };

  if (metadata.type === "onApp") {
    const { insertId: postId } = await db.transaction(async (tx) => {
      const [post] = await tx
        .insert(schema.post)
        .values({
          ...data,
          recipient: metadata.recipient,
        })
        .returning({ insertId: schema.post.id });

      if (post === undefined) {
        throw new Error("Failed to insert post");
      }

      await tx.insert(schema.postStats).values({ postId: post.insertId });
      return post;
    });

    await storeNotification(metadata.author, metadata.recipient, {
      eventType: "post",
      entityType: "post",
      entityId: postId.toString(),
    });

    const { posts } = await getNotificationSettings(metadata.recipient);
    if (!posts) return;

    const pushTokens = await getPushTokens(metadata.recipient);
    if (pushTokens.length === 0) return;

    const senderProfile = await getProfile(metadata.author);

    await sendNotification(pushTokens, metadata.author, metadata.recipient, {
      title: "You've been opped",
      body: `${senderProfile.username} posted a video of you`,
      entityId: postId.toString(),
      entityType: "post",
    });
  } else {
    await db.insert(schema.postOfUserNotOnApp).values({
      ...data,
      phoneNumber: metadata.number,
    });
  }
};

export const handler = middy(lambdaHandler).use(
  parser({ schema: APIGatewayProxyEventV2Schema }),
);
