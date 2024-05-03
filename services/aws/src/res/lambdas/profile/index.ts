import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyResult, Context, S3Event } from "aws-lambda";

import type { ProfileMetadata } from "../../../utils";

const s3Client = new S3Client({ region: "us-east-1" });

export const handler = async (
  event: S3Event,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  const record = event.Records[0];

  if (!record) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "No record found in event",
      }),
    };
  }

  const objectKey = record.s3.object.key;
  const objectBucket = record.s3.bucket.name;

  const command = new HeadObjectCommand({
    Bucket: objectBucket,
    Key: objectKey,
  });

  try {
    const response = await s3Client.send(command);

    const metadata = response.Metadata as ProfileMetadata | undefined;
    console.log(metadata)

    if (metadata === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "No Metadata found on object",
        }),
      };
    }

    const serverEndpoint =
      " https://5bdc-74-12-66-138.ngrok-free.app/api/profilePicture";

    try {
      const response = await fetch(serverEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: metadata.user,
          key: objectKey,
        }),
      });

      const jsonResponse = await response.json();

      console.log("Server response:", jsonResponse);
    } catch (error) {
      console.error("Error sending metadata to server:", error);
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error getting object from S3",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Object found in S3",
    }),
  };
};
