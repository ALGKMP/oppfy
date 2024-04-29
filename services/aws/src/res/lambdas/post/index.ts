import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyResult, Context, S3Event } from "aws-lambda";

import ZodSchemas from "@acme/validators";

const s3Client = new S3Client({ region: "us-east-1" });

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

  const command = new HeadObjectCommand({
    Bucket: objectBucket,
    Key: objectKey,
  });

  try {
    const { Metadata } = await s3Client.send(command);
    if (!Metadata) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "No metadata found on object",
        }),
      };
    };
    
    const metadata = ZodSchemas.post.metadata.parse(Metadata);

    // Temporarily hardcoding the server endpoint
    const serverEndpoint =
      "https://5bdc-74-12-66-138.ngrok-free.app/api/uploadPost";

    const response = await fetch(serverEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postedBy: metadata.postedBy,
        postedFor: metadata.postedFor,
        caption: metadata.caption, // Handle other fields similarly
        objectKey: objectKey,
      }),
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
