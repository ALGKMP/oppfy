import { parser } from "@aws-lambda-powertools/parser/middleware";
import { S3Schema } from "@aws-lambda-powertools/parser/schemas";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import middy from "@middy/core";
import type { Context } from "aws-lambda";
import type { z } from "zod";

import { db, schema } from "@oppfy/db";
import { sharedValidators } from "@oppfy/validators";

type S3ObjectLambdaEvent = z.infer<typeof S3Schema>;

const s3 = new S3Client({
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

  const objectKey = record.s3.object.key;
  const objectBucket = record.s3.bucket.name;

  const command = new HeadObjectCommand({
    Bucket: objectBucket,
    Key: objectKey,
  });

  const { Metadata } = await s3.send(command);

  if (Metadata === undefined) {
    throw new Error("Metadata not provided");
  }

  const metadata = sharedValidators.aws.metadataSchema.parse({
    ...Metadata,
    type: Metadata.type,
  });

  const data = {
    author: metadata.author,
    height: parseInt(metadata.height),
    width: parseInt(metadata.width),
    caption: metadata.caption,
    key: objectKey,
  };

  if (metadata.type === "onApp") {
    await db.transaction(async (tx) => {
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
    });
  } else {
    await db.insert(schema.postOfUserNotOnApp).values({
      ...data,
      phoneNumber: metadata.number,
    });
  }
};

export const handler = middy(lambdaHandler).use(parser({ schema: S3Schema }));
