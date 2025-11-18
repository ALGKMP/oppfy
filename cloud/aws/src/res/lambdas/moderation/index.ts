import {
  DetectModerationLabelsCommand,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type {
  Context,
  SQSBatchResponse,
  SQSEvent,
  SQSRecord,
} from "aws-lambda";
import { eq, sql } from "drizzle-orm";
import pLimit from "p-limit";
import { z } from "zod";

import { db, schema } from "@oppfy/db";
import { Mux } from "@oppfy/mux";

const REGION = process.env.AWS_REGION ?? "us-east-1";
const REKOGNITION_CONFIDENCE_THRESHOLD = 60;
const MAX_CONCURRENT_REKOGNITION_CALLS = 50;

const s3 = new S3Client({ region: REGION });
const rekognition = new RekognitionClient({ region: REGION });
const mux = new Mux();

// Type definitions
type ModerationLabel = {
  Name?: string;
  ParentName?: string;
  Confidence?: number;
};

interface ModerationResult {
  isExplicit: boolean;
  labels?: string[];
  confidence?: number;
}

interface ImageJob {
  type: "image";
  bucket: string;
  key: string;
  postId: string;
}

interface VideoJob {
  type: "video";
  assetId: string;
  playbackId: string;
  postId: string;
  timestamps: number[];
}

// Zod schemas
const s3NotificationSchema = z.object({
  Records: z.array(
    z.object({
      s3: z.object({
        bucket: z.object({ name: z.string() }),
        object: z.object({ key: z.string() }),
      }),
    }),
  ),
});

const videoJobSchema = z.object({
  type: z.literal("video"),
  assetId: z.string(),
  playbackId: z.string(),
  postId: z.string().uuid(),
  timestamps: z.array(z.number()),
  durationSec: z.number().optional(),
});

/**
 * Run Rekognition moderation check and process results
 */
async function runModerationCheck(
  imageSource: { S3Object: { Bucket: string; Name: string } } | { Bytes: Uint8Array },
  label: string,
): Promise<ModerationResult> {
  const response = await rekognition.send(
    new DetectModerationLabelsCommand({
      Image: imageSource,
      MinConfidence: REKOGNITION_CONFIDENCE_THRESHOLD,
    }),
  );

  const labels = response.ModerationLabels as ModerationLabel[] | undefined;
  const result = processModerationLabels(labels);

  console.log(`Rekognition result for ${label}:`, {
    isExplicit: result.isExplicit,
    labels: labels?.map((l) => ({
      name: l.Name,
      parent: l.ParentName,
      confidence: l.Confidence,
    })),
  });

  return result;
}

/**
 * Process moderation labels to determine if content is explicit
 */
function processModerationLabels(labels?: ModerationLabel[]): ModerationResult {
  const explicitLabels = labels?.filter(
    (l) =>
      l.Name &&
      (l.Name.includes("Explicit") ||
        l.Name.includes("Nudity") ||
        l.Name.includes("Sexual") ||
        l.Name?.includes("Drugs")),
  );

  if (explicitLabels?.length) {
    return {
      isExplicit: true,
      labels: explicitLabels.map((l) => l.Name ?? "Unknown"),
      confidence: explicitLabels[0]?.Confidence,
    };
  }

  return { isExplicit: false };
}

/**
 * Fetch thumbnail from Mux Image API
 */
async function fetchMuxThumbnail(
  playbackId: string,
  timeSec: number,
): Promise<Uint8Array> {
  const url = new URL(`https://image.mux.com/${playbackId}/thumbnail.jpg`);
  url.searchParams.set("time", timeSec.toString());
  url.searchParams.set("fit_mode", "pad");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Mux thumbnail at ${timeSec}s (status ${response.status})`,
    );
  }

  return new Uint8Array(await response.arrayBuffer());
}

/**
 * Extract postId from S3 object metadata or key pattern
 */
async function getPostIdFromS3(
  bucket: string,
  key: string,
): Promise<string | null> {
  try {
    // Use HeadObject instead of GetObject - only fetches metadata, not the entire object
    const response = await s3.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );

    // Check metadata first
    if (response.Metadata?.postid) {
      return response.Metadata.postid;
    }

    // Extract from key pattern: photos/{postId}.jpg or photos/{userId}/{postId}.jpg
    const match = /photos\/.*?([a-f0-9-]{36})\.(jpg|jpeg|png)$/i.exec(key);
    return match?.[1] ?? null;
  } catch (error) {
    console.error(`Failed to get postId from ${bucket}/${key}:`, error);
    return null;
  }
}

/**
 * Delete post and decrement user stats if processed
 */
async function deletePost(
  postId: string,
  context: string,
): Promise<void> {
  const post = await db.query.post.findFirst({
    where: eq(schema.post.id, postId),
  });

  if (!post) {
    console.log(`Post ${postId} already deleted, skipping cleanup for ${context}`);
    return;
  }

  // Decrement user stats if post was already marked as processed
  if (post.status === "processed") {
    await db
      .update(schema.userStats)
      .set({ posts: sql`GREATEST(${schema.userStats.posts} - 1, 0)` })
      .where(eq(schema.userStats.userId, post.recipientUserId));
  }

  await db.delete(schema.post).where(eq(schema.post.id, postId));
  console.log(`Deleted post ${postId} for ${context}`);
}

/**
 * Process photo moderation job
 */
async function processPhotoJob(job: ImageJob): Promise<void> {
  const { bucket, key, postId } = job;
  console.log("Processing photo moderation", { bucket, key, postId });

  // Check if post exists
  const postExists = await db.query.post.findFirst({
    where: eq(schema.post.id, postId),
    columns: { id: true },
  });

  if (!postExists) {
    console.log(`Post ${postId} not found, skipping ${key}`);
    return;
  }

  // Run moderation
  const result = await runModerationCheck(
    { S3Object: { Bucket: bucket, Name: key } },
    `S3: ${bucket}/${key}`,
  );

  if (result.isExplicit) {
    console.log(
      `Explicit content in ${key}: ${result.labels?.join(", ")} (${result.confidence}%)`,
    );

    // Delete S3 object
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    console.log(`Deleted S3 object: ${key}`);

    // Delete post and update stats
    await deletePost(postId, `explicit image ${key}`);
  } else {
    console.log(`Photo ${key} passed moderation`);
  }
}

/**
 * Process video moderation job - checks multiple frames in parallel
 */
async function processVideoJob(job: VideoJob): Promise<void> {
  const { assetId, playbackId, postId, timestamps } = job;
  console.log(`Processing video moderation: ${assetId} (${timestamps.length} frames)`);

  // Check if post exists
  const post = await db.query.post.findFirst({
    where: eq(schema.post.id, postId),
    columns: { id: true, status: true, recipientUserId: true },
  });

  if (!post) {
    console.log(`Post ${postId} not found, skipping video ${assetId}`);
    return;
  }

  // Check all frames in parallel with concurrency limit
  const limit = pLimit(MAX_CONCURRENT_REKOGNITION_CALLS);
  let violation: { time: number; result: ModerationResult } | null = null;

  await Promise.all(
    timestamps.map((timeSec, index) =>
      limit(async () => {
        // Skip if violation already found
        if (violation) return;

        try {
          const bytes = await fetchMuxThumbnail(playbackId, timeSec);
          const result = await runModerationCheck(
            { Bytes: bytes },
            `Video ${assetId} frame ${index} @ ${timeSec}s`,
          );

          if (result.isExplicit && !violation) {
            violation = { time: timeSec, result };
          }
        } catch (error) {
          console.error(`Failed to check frame ${index} @ ${timeSec}s:`, error);
        }
      }),
    ),
  );

  if (violation !== null) {
    const violationData: { time: number; result: ModerationResult } = violation;
    console.log(
      `Explicit content in video ${assetId} @ ${violationData.time}s: ${violationData.result.labels?.join(", ")}`,
    );

    // Delete Mux asset
    try {
      await mux.deleteAsset(assetId);
      console.log(`Deleted Mux asset: ${assetId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!msg.includes("not found") && !msg.includes("404")) {
        console.error(`Failed to delete Mux asset ${assetId}:`, error);
      }
    }

    // Delete post and update stats
    await deletePost(postId, `explicit video ${assetId}`);
  } else {
    console.log(`Video ${assetId} passed moderation`);
  }
}

/**
 * Parse SQS record into ImageJob or VideoJob
 */
async function parseRecord(record: SQSRecord): Promise<ImageJob | VideoJob | null> {
  try {
    const body = JSON.parse(record.body) as unknown;

    // Try video job schema
    const videoResult = videoJobSchema.safeParse(body);
    if (videoResult.success) {
      console.log("Parsed video job:", {
        assetId: videoResult.data.assetId,
        postId: videoResult.data.postId,
        frames: videoResult.data.timestamps.length,
      });
      return videoResult.data;
    }

    // Try S3 notification schema
    const s3Result = s3NotificationSchema.safeParse(body);
    if (s3Result.success) {
      const s3Record = s3Result.data.Records[0];
      if (!s3Record) return null;

      const bucket = s3Record.s3.bucket.name;
      const key = decodeURIComponent(s3Record.s3.object.key.replace(/\+/g, " "));

      const postId = await getPostIdFromS3(bucket, key);
      if (!postId) {
        console.warn(`Could not determine postId for ${key}`);
        return null;
      }

      console.log("Parsed photo job:", { bucket, key, postId });
      return { type: "image", bucket, key, postId };
    }

    console.warn("Unknown message format:", body);
    return null;
  } catch (error) {
    console.error("Failed to parse SQS record:", error);
    return null;
  }
}

/**
 * Lambda handler for SQS batch processing
 */
export const handler = async (
  event: SQSEvent,
  _context: Context,
): Promise<SQSBatchResponse> => {
  console.log(`Processing ${event.Records.length} SQS records`);

  // Parse all records
  const jobs = await Promise.all(
    event.Records.map(async (record) => ({
      record,
      job: await parseRecord(record),
    })),
  );

  // Separate by job type
  const photoJobs = jobs.filter((j) => j.job?.type === "image");
  const videoJobs = jobs.filter((j) => j.job?.type === "video");

  console.log(`Jobs: ${photoJobs.length} photos, ${videoJobs.length} videos`);

  const failedMessageIds: string[] = [];

  // Process photos in parallel with concurrency limit
  const photoLimit = pLimit(MAX_CONCURRENT_REKOGNITION_CALLS);
  await Promise.allSettled(
    photoJobs.map(({ record, job }) =>
      photoLimit(async () => {
        try {
          await processPhotoJob(job as ImageJob);
        } catch (error) {
          console.error("Failed to process photo job:", error);
          failedMessageIds.push(record.messageId);
        }
      }),
    ),
  );

  // Process videos sequentially (each processes frames in parallel internally)
  for (const { record, job } of videoJobs) {
    try {
      await processVideoJob(job as VideoJob);
    } catch (error) {
      console.error("Failed to process video job:", error);
      failedMessageIds.push(record.messageId);
    }
  }

  console.log(
    `Completed: ${failedMessageIds.length}/${event.Records.length} failed`,
  );

  return {
    batchItemFailures: failedMessageIds.map((id) => ({
      itemIdentifier: id,
    })),
  };
};
