import { parser } from "@aws-lambda-powertools/parser/middleware";
import { S3Schema } from "@aws-lambda-powertools/parser/schemas";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import middy from "@middy/core";
import { createEnv } from "@t3-oss/env-core";
import type { Context } from "aws-lambda";
import { z } from "zod";

import { db, eq, schema } from "@oppfy/db";
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

type S3ObjectLambdaEvent = z.infer<typeof S3Schema>;

const env = createEnv({
  server: {
    SNS_PUSH_NOTIFICATION_TOPIC_ARN: z.string().min(1),
  },
  runtimeEnv: process.env,
});

const s3 = new S3Client({
  region: "us-east-1",
});

const sns = new SNSClient({
  region: "us-east-1",
});

const lambdaHandler = async (
  event: S3ObjectLambdaEvent,
  _context: Context,
): Promise<void> => {
  const record = event.Records[0];

  if (record === undefined) {
    throw new Error("Record not provided");
  }

  const key = record.s3.object.key;
  const objectBucket = record.s3.bucket.name;

  const command = new HeadObjectCommand({
    Bucket: objectBucket,
    Key: key,
  });

  const { Metadata } = await s3.send(command);

  if (Metadata === undefined) {
    throw new Error("Metadata not provided");
  }

  const metadata = sharedValidators.aws.metadataSchema.parse(Metadata);

  // decode the caption
  metadata.caption = decodeURIComponent(metadata.caption);

  if (metadata.type === "onApp") {
    const { insertId: postId } = await db.transaction(async (tx) => {
      const [post] = await tx
        .insert(schema.post)
        .values({
          authorId: metadata.author,
          recipientId: metadata.recipient,
          key: key,
          mediaType: "image" as const,
          height: parseInt(metadata.height),
          width: parseInt(metadata.width),
          caption: metadata.caption,
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
      body: `${senderProfile.username} posted a picture of you`,
      entityId: postId.toString(),
      entityType: "post",
    });
  } else {
    // await db.insert(schema.postOfUserNotOnApp).values({
    //   ...data,
    //   phoneNumber: metadata.number,
    // });
  }
};

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

export const handler = middy(lambdaHandler).use(parser({ schema: S3Schema }));
