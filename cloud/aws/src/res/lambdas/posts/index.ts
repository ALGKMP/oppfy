import { parser } from "@aws-lambda-powertools/parser/middleware";
import { S3Schema } from "@aws-lambda-powertools/parser/schemas";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import middy from "@middy/core";
import { createEnv } from "@t3-oss/env-core";
import type { Context } from "aws-lambda";
import { z } from "zod";

import { db, eq, schema, sql } from "@oppfy/db";

type S3ObjectLambdaEvent = z.infer<typeof S3Schema>;

const SQS = new SQSClient({ region: "us-east-1" });

const s3 = new S3Client({
  region: "us-east-1",
});

const env = createEnv({
  server: {
    SQS_NOTIFICATION_QUEUE: z.string().min(1),
  },
  runtimeEnv: process.env,
});

const lambdaHandler = async (
  event: S3ObjectLambdaEvent,
  _context: Context,
): Promise<void> => {
  console.log("event", event);

  const record = event.Records[0];

  if (record === undefined) {
    throw new Error("Record not provided");
  }

  const key = record.s3.object.key;
  const objectBucket = record.s3.bucket.name;

  try {
    const command = new HeadObjectCommand({
      Bucket: objectBucket,
      Key: key,
    });

    const { Metadata } = await s3.send(command);

    if (Metadata === undefined) {
      throw new Error("Metadata not provided");
    }

    const metadataSchema = z.object({
      postid: z.string(),
    });

    const metadata = metadataSchema.parse(Metadata);

    console.log("metadata", metadata);
    console.log("metadata.postid", metadata.postid);
    try {
      // transaction to update post status and user stats
      const post = await db.transaction(async (tx) => {
        const post = await tx.query.post.findFirst({
          where: eq(schema.post.id, metadata.postid),
        });
        if (post === undefined) {
          throw new Error("Failed to insert post");
        }

        await tx
          .update(schema.post)
          .set({
            status: "processed",
          })
          .where(eq(schema.post.id, post.id));

        // Only increment recipient's profile stats post count since they're the one being posted about
        await tx
          .update(schema.userStats)
          .set({ posts: sql`${schema.userStats.posts} + 1` })
          .where(
            eq(
              schema.userStats.userId,
              sql`(SELECT recipient_user_id FROM post WHERE id = ${post.id})`,
            ),
          );

        return post;
      });

      // get profile of poster
      const authorProfile = await db.query.profile.findFirst({
        where: eq(schema.profile.userId, post.authorUserId),
      });
      if (!authorProfile) {
        // nothing
        return;
      }

      console.log("here", env.SQS_NOTIFICATION_QUEUE);

      // send noti
      const notiSqsParams = {
        senderId: post.authorUserId,
        recipientId: post.recipientUserId,
        title: "You've been opped",
        body: `${authorProfile.username} posted a picture of you`,
        entityType: "post",
        entityId: post.id,
        eventType: "post",
      };

      const command = new SendMessageCommand({
        QueueUrl: env.SQS_NOTIFICATION_QUEUE,
        MessageBody: JSON.stringify(notiSqsParams),
      });

      await SQS.send(command);
    } catch (error) {
      console.log("error", error);
      // If the transaction fails, delete the S3 object
      throw error;
    }
  } catch (error) {
    console.error("Error processing post:", error);
    // Ensure S3 object is deleted in case of any error
    throw error;
  }
};

// const sendNotification = async (
//   pushTokens: string[],
//   senderId: string,
//   recipientId: string,
//   notificationData: SendNotificationData,
// ) => {
//   const message = {
//     senderId,
//     recipientId,
//     pushTokens,
//     ...notificationData,
//   } satisfies SnsNotificationData;
//   const params = {
//     Subject: "New notification",
//     TopicArn: env.SNS_PUSH_NOTIFICATION_TOPIC_ARN,
//     Message: JSON.stringify(message),
//   };
//   await sns.send(new PublishCommand(params));
// };

// const storeNotification = async (
//   senderId: string,
//   recipientId: string,
//   notificationData: StoreNotificationData,
// ) => {
//   await db.insert(schema.notifications).values({
//     senderId,
//     recipientId,
//     ...notificationData,
//   });
// };

// const getProfile = async (userId: string) => {
//   const user = await db.query.user.findFirst({
//     where: eq(schema.user.id, userId),
//     with: {
//       profile: true,
//     },
//   });

//   if (user === undefined) {
//     throw new Error("User not found");
//   }

//   return user.profile;
// };

// const getNotificationSettings = async (userId: string) => {
//   const user = await db.query.user.findFirst({
//     where: eq(schema.user.id, userId),
//     with: {
//       notificationSettings: true,
//     },
//   });

//   if (user === undefined) {
//     throw new Error("User not found");
//   }

//   return user.notificationSettings;
// };

// const getPushTokens = async (userId: string) => {
//   const possiblePushTokens = await db.query.pushToken.findMany({
//     where: eq(schema.pushToken.userId, userId),
//     columns: {
//       token: true,
//     },
//   });

//   return possiblePushTokens.map((token) => token.token);
// };

export const handler = middy(lambdaHandler).use(parser({ schema: S3Schema }));
