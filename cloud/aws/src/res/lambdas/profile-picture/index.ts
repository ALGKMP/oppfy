import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyResult, Context, S3Event } from "aws-lambda";

import { db, eq, schema } from "@oppfy/db";
import { env } from "@oppfy/env";
import type { OpenSearchProfileIndexResult } from "@oppfy/opensearch";
import { openSearch, OpenSearchIndex } from "@oppfy/opensearch";
import { sharedValidators } from "@oppfy/validators";

const s3Client = new S3Client({ region: "us-east-1" });
const cloudFrontClient = new CloudFrontClient({ region: "us-east-1" });

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
    const s3Response = await s3Client.send(command).catch((err) => {
      console.error("Failed to retrieve S3 object metadata:", err);
      throw err; // Rethrow to handle it in the outer try-catch block
    });

    const metadata =
      sharedValidators.aws.s3ObjectMetadataForProfilePicturesSchema.parse(
        s3Response.Metadata,
      );

    console.log(metadata);

    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, metadata.user),
    });

    if (!user) {
      throw new Error("User not found");
    }

    await db
      .update(schema.profile)
      .set({
        profilePictureKey: objectKey,
      })
      .where(eq(schema.profile.id, user.profileId));

    console.log("USER ID: ", user.id);

    await upsertProfile(user.id, {
      profilePictureKey: objectKey,
    });

    await createCloudFrontInvalidation(objectKey);

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

const createCloudFrontInvalidation = async (objectKey: string) => {
  const params = {
    DistributionId: env.CLOUDFRONT_PROFILE_DISTRIBUTION_ID,
    InvalidationBatch: {
      CallerReference: Date.now().toString(),
      Paths: {
        Quantity: 1,
        Items: [`/${objectKey}`],
      },
    },
  };

  const command = new CreateInvalidationCommand(params);
  return cloudFrontClient.send(command);
};

const upsertProfile = async (
  userId: string,
  newProfileData: Partial<OpenSearchProfileIndexResult>,
) => {
  const userWithProfile = await db.query.user.findFirst({
    where: eq(schema.user.id, userId),
    with: {
      profile: {
        columns: {
          username: true,
          fullName: true,
          bio: true,
          dateOfBirth: true,
          profilePictureKey: true,
        },
      },
    },
  });

  if (userWithProfile === undefined) {
    throw new Error("Profile not found");
  }
  const profileData = userWithProfile.profile;

  const documentBody = {
    ...profileData,
    ...newProfileData,
  };

  await openSearch.index({
    index: OpenSearchIndex.PROFILE,
    id: userId,
    body: documentBody,
  });
};
