import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import type { APIGatewayProxyResult, S3Event, Context } from "aws-lambda";

import type { PostMetadata } from "../../../utils";

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
  console.log("Record: ", record);

  const objectKey = record.s3.object.key;
  const objectBucket = record.s3.bucket.name;

  const command = new HeadObjectCommand({
    Bucket: objectBucket,
    Key: objectKey,
  });

  try {
    console.log("Getting metadata for object: ", objectKey);
    const { Metadata } = await s3Client.send(command);
    const metadata = Metadata as PostMetadata | undefined;

    if (!metadata?.author || !metadata?.recipient) {
      console.log("Metadata: ", metadata)
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Required metadata (authorid | recipientid) not found on object" }),
      };
    }
    console.log("Metadata: ", metadata);

    const serverEndpoint =     
    "https://5bdc-74-12-66-138.ngrok-free.app/api/uploadPost";

    const response = await fetch(serverEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        author: metadata.author,
        recipient: metadata.recipient,
        caption: metadata.caption, // Handle other fields similarly
        objectKey: objectKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const jsonResponse = await response.json();
    console.log("Server response:", jsonResponse);

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
