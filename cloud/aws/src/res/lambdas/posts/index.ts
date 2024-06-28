import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyResult, Context, S3Event } from "aws-lambda";
import { createInsertSchema } from "drizzle-zod";

import { db, schema } from "@oppfy/db";
import { sharedValidators, trpcValidators } from "@oppfy/validators";

export const s3Client = new S3Client({
  region: "us-east-1",
});

export const handler = async (
  event: S3Event,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  const record = event.Records[0];

  if (!record) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "No record found in event" }),
    };
  }

  const objectKey = record.s3.object.key;
  const objectBucket = record.s3.bucket.name;

  console.log("Received event:", JSON.stringify(event));

  const command = new HeadObjectCommand({
    Bucket: objectBucket,
    Key: objectKey,
  });

  try {
    const res = await s3Client.send(command).catch((err) => {
      console.error("Failed to retrieve S3 object metadata:", err);
      throw err; // Rethrow to handle it in the outer try-catch block
    });

    const Metadata = res.Metadata;

    console.log(res.Metadata);

    if (!Metadata) {
      console.log("No metadata present for the object:", objectKey);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Metadata for the object not found." }),
      };
    }

    const metadata = sharedValidators.media.postMetadataForS3.parse(Metadata);
    const insertPostSchema = createInsertSchema(schema.post);

    const body = insertPostSchema.parse({
      author: metadata.author,
      recipient: metadata.recipient,
      height: parseInt(metadata.height),
      width: parseInt(metadata.width),
      caption: metadata.caption,
      key: objectKey,
    });

    const post = await db.insert(schema.post).values(body);
    await db.insert(schema.postStats).values({ postId: post[0].insertId });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Post processed successfully" }),
    };
  } catch (error) {
    console.error("Error processing post:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error processing post" }),
    };
  }
};
