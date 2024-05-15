import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyResult, Context, S3Event } from "aws-lambda";

import { trpcValidators } from "@acme/validators";

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

  console.log("Bucket:", objectBucket);
  console.log("Key:", objectKey);

  console.log("Received event:", JSON.stringify(event));

  const command = new HeadObjectCommand({
    Bucket: objectBucket,
    Key: objectKey,
  });
  console.log(command)

  try {
    const res = await s3Client.send(command).catch(err => {
      console.error("Failed to retrieve S3 object metadata:", err);
      throw err; // Rethrow to handle it in the outer try-catch block
    });

    const Metadata = res.Metadata;

    console.log(res.Metadata);

    if (!Metadata) {
      console.log("No metadata present for the object:", objectKey);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Metadata for the object not found." })
      };
    };

    const metadata = trpcValidators.post.metadata.parse(Metadata);

    // Temporarily hardcoding the server endpoint
    const serverEndpoint =
      "https://f753-2607-fea8-4cc0-7170-541f-28f6-c2ed-dab2.ngrok-free.app/api/uploadPost";

    const body = trpcValidators.post.uploadPost.parse({
        author: metadata.author,
        recipient: metadata.recipient,
        caption: metadata.caption,
        key: objectKey,
    });

    if (!body) {
      console.log("Failed to parse metadata:", Metadata);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Failed to parse metadata" }),
      };
    }

    const response = await fetch(serverEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

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
