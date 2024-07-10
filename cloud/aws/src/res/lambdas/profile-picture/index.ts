import { profile } from "console";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyResult, Context, S3Event } from "aws-lambda";
import { z } from "zod";

import { db, eq, schema } from "@oppfy/db";
import {
  openSearch,
  OpenSearchIndex,
  OpenSearchProfileIndexResult,
  OpenSearchResponse,
} from "@oppfy/opensearch";

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
    const s3Response = await s3Client.send(command).catch((err) => {
      console.error("Failed to retrieve S3 object metadata:", err);
      throw err; // Rethrow to handle it in the outer try-catch block
    });

    const metadata = z
      .object({
        user: z.string(),
      })
      .parse(s3Response.Metadata);

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

    // Search for existing document
    const searchResult = await openSearch.search<
      OpenSearchResponse<OpenSearchProfileIndexResult>
    >({
      index: OpenSearchIndex.PROFILE,
      body: {
        query: {
          term: { id: user.profileId },
        },
      },
    });

    if (searchResult.body.hits.hits.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "OpenSearch profile index missing.",
        }),
      };
    }

    const documentId = searchResult.body.hits.hits[0]?._id;

    if (documentId === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "DocumentId not found.",
        }),
      };
    }

    await openSearch.update({
      index: OpenSearchIndex.PROFILE,
      id: documentId,
      body: {
        doc: {
          profilePictureKey: objectKey,
          id: user.profileId, // Ensure the id is always included
        },
      },
    });

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
