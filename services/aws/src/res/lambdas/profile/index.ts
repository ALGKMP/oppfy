import type { HeadObjectCommandInput } from "@aws-sdk/client-s3";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyResult, Context, S3Event } from "aws-lambda";

import type { ProfileMetadata } from "../../../utils";

export const region = "us-east-1";

const s3Client = new S3Client();

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

  const headObjectCommandInput: HeadObjectCommandInput = {
    Bucket: objectBucket,
    Key: objectKey,
  };

  const command = new HeadObjectCommand(headObjectCommandInput);

  try {
    const response = await s3Client.send(command);

    const metadata = response.Metadata as ProfileMetadata | undefined;

    if (metadata === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "No Metadata found on object",
        }),
      };
    }
    console.log("Metadata:", metadata);

    const serverEndpoint =
    " https://5bdc-74-12-66-138.ngrok-free.app/api/profilePicture";

  try {
    const response = await fetch(serverEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userid: metadata.userid,
        key: objectKey,
        bucket: objectBucket,
      }),
    });

    const jsonResponse = await response.json();

    console.log("Server response:", jsonResponse);
  } catch (error) {
    console.error("Error sending metadata to server:", error);
  }
}

catch (error) {
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
