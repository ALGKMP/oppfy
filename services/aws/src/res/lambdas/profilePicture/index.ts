import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyResult, Context, S3Event } from "aws-lambda";

import { trpcValidators } from "@acme/validators";

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
    const s3Response = await s3Client.send(command).catch(err => {
      console.error("Failed to retrieve S3 object metadata:", err);
      throw err; // Rethrow to handle it in the outer try-catch block
    });

    const metadata = trpcValidators.post.profilePictureMetadata.parse(
      s3Response.Metadata,
    );

    const body = trpcValidators.profile.uploadProfilePictureOpenApi.parse({
      user: metadata.user,
      key: objectKey,
    });

    console.log(metadata);
    console.log(body);

    const serverEndpoint =
      "https://9f16-2607-fea8-4cc0-7170-4d83-e12d-1e92-3c84.ngrok-free.app/api/profilePicture";

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
    console.log("after response.ok")


    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Post processed successfully" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error uploading profile picture.",
      }),
    };
  }
};
