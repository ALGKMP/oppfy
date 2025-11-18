import {
  DetectModerationLabelsCommand,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";
import {
  DeleteObjectCommand,
  GetObjectCommand,
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

// Message schemas
const s3NotificationSchema = z.object({
  Records: z.array(
    z.object({
      s3: z.object({
        bucket: z.object({
          name: z.string(),
        }),
        object: z.object({
          key: z.string(),
        }),
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

type VideoJob = z.infer<typeof videoJobSchema>;

interface ImageJob {
  type: "image";
  bucket: string;
  key: string;
  postId: string;
}

interface ModerationResult {
  isExplicit: boolean;
  labels?: string[];
  confidence?: number;
}

/**
 * Check if an image contains explicit content using Rekognition (S3 object)
 */
async function checkImageModerationS3(
  bucket: string,
  key: string,
): Promise<ModerationResult> {
  console.log("Running Rekognition on S3 object", { bucket, key });
  try {
    const response = (await rekognition.send(
      new DetectModerationLabelsCommand({
        Image: {
          S3Object: {
            Bucket: bucket,
            Name: key,
          },
        },
        MinConfidence: REKOGNITION_CONFIDENCE_THRESHOLD,
      }),
    )) as {
      ModerationLabels?: {
        Name?: string;
        ParentName?: string;
        Confidence?: number;
      }[];
    };

    const result = processModerationLabels(response.ModerationLabels);
    console.log("Rekognition result for S3 object", {
      bucket,
      key,
      labels: response.ModerationLabels?.map((moderationLabel) => ({
        name: moderationLabel.Name,
        parent: moderationLabel.ParentName,
        confidence: moderationLabel.Confidence,
      })),
      isExplicit: result.isExplicit,
    });

    return result;
  } catch (error) {
    console.error(`Failed to run Rekognition on ${bucket}/${key}:`, error);
    throw error;
  }
}

/**
 * Check if an image contains explicit content using Rekognition (image bytes)
 */
async function checkImageModerationBytes(
  imageBytes: Uint8Array,
  label: string,
): Promise<ModerationResult> {
  console.log("Running Rekognition on image bytes", { label });
  try {
    const response = (await rekognition.send(
      new DetectModerationLabelsCommand({
        Image: {
          Bytes: imageBytes,
        },
        MinConfidence: REKOGNITION_CONFIDENCE_THRESHOLD,
      }),
    )) as {
      ModerationLabels?: {
        Name?: string;
        ParentName?: string;
        Confidence?: number;
      }[];
    };

    const result = processModerationLabels(response.ModerationLabels);
    console.log("Rekognition result for image bytes", {
      label,
      labels: response.ModerationLabels?.map((moderationLabel) => ({
        name: moderationLabel.Name,
        parent: moderationLabel.ParentName,
        confidence: moderationLabel.Confidence,
      })),
      isExplicit: result.isExplicit,
    });

    return result;
  } catch (error) {
    console.error(`Rekognition error for ${label}:`, error);
    throw error;
  }
}

/**
 * Process moderation labels from Rekognition response
 */
function processModerationLabels(
  moderationLabels?: {
    Name?: string;
    ParentName?: string;
    Confidence?: number;
  }[],
): ModerationResult {
  const explicitLabels = moderationLabels?.filter(
    (label: { Name?: string; ParentName?: string; Confidence?: number }) =>
      label.Name &&
      (label.Name.includes("Explicit") ||
        label.Name.includes("Nudity") ||
        label.Name.includes("Sexual") ||
        label.ParentName?.includes("Explicit")),
  );

  if (explicitLabels && explicitLabels.length > 0) {
    const topLabel = explicitLabels[0];
    return {
      isExplicit: true,
      labels: explicitLabels.map((l: { Name?: string }) => l.Name ?? "Unknown"),
      confidence: topLabel?.Confidence,
    };
  }

  return { isExplicit: false };
}

/**
 * Fetch thumbnail from Mux Image API
 */
async function fetchThumbnailFromMux(
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

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Extract postId from S3 object metadata or key
 */
async function getPostIdFromS3Object(
  bucket: string,
  key: string,
): Promise<string | null> {
  try {
    const response = (await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    )) as { Metadata?: Record<string, string> };

    // Try to get postId from metadata
    const postId = response.Metadata?.postid;
    if (postId) {
      return postId;
    }

    // For photos, try to extract from key pattern: photos/{postId}.jpg or photos/{userId}/{postId}.jpg
    const photoRegex = /photos\/.*?([a-f0-9-]{36})\.(jpg|jpeg|png)$/i;
    const photoMatch = photoRegex.exec(key);
    if (photoMatch?.[1]) {
      return photoMatch[1];
    }

    return null;
  } catch (error) {
    console.error(`Failed to get postId from ${bucket}/${key}:`, error);
    return null;
  }
}

/**
 * Delete S3 object and delete post from database for explicit image
 */
async function handleExplicitImage(
  bucket: string,
  key: string,
  postId: string,
  result: ModerationResult,
): Promise<void> {
  console.log(
    `Explicit content detected in ${key}: ${result.labels?.join(", ")} (confidence: ${result.confidence}%)`,
  );

  try {
    // Delete the S3 object
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    // Get post info before deleting to decrement user's post count
    const post = await db.query.post.findFirst({
      where: eq(schema.post.id, postId),
    });

    if (post && post.status === "processed") {
      // Decrement recipient's post count since it was already incremented
      await db
        .update(schema.userStats)
        .set({ posts: sql`GREATEST(${schema.userStats.posts} - 1, 0)` })
        .where(eq(schema.userStats.userId, post.recipientUserId));
    }

    // Delete the post from the database
    await db.delete(schema.post).where(eq(schema.post.id, postId));

    console.log(
      `Deleted explicit image ${key} and removed post ${postId} from database due to moderation violation`,
    );
  } catch (error) {
    console.error(`Failed to delete explicit image ${key}:`, error);
    throw error;
  }
}

/**
 * Process a single photo from S3 notification
 */
async function processPhotoJob(imageJob: ImageJob): Promise<void> {
  const { bucket, key, postId } = imageJob;

  console.log("Processing photo moderation job", { bucket, key, postId });

  // Check if post still exists and is pending
  const post = await db.query.post.findFirst({
    where: eq(schema.post.id, postId),
  });

  if (!post) {
    console.log(`Post ${postId} not found, skipping moderation for ${key}`);
    return;
  }

  // Run Rekognition on S3 object
  const result = await checkImageModerationS3(bucket, key);

  if (result.isExplicit) {
    await handleExplicitImage(bucket, key, postId, result);
  } else {
    console.log(`Photo ${key} passed moderation for post ${postId}`);
  }
}

/**
 * Process a video job - fetch thumbnails from Mux and check all frames in parallel
 */
async function processVideoJob(videoJob: VideoJob): Promise<void> {
  const { assetId, playbackId, postId, timestamps } = videoJob;

  console.log(
    `Processing video moderation for asset ${assetId}, ${timestamps.length} frames`,
  );

  // Check if post exists (if not, it may have been deleted by a previous moderation run)
  const post = await db.query.post.findFirst({
    where: eq(schema.post.id, postId),
  });

  if (!post) {
    console.log(
      `Post ${postId} not found (may have been deleted by previous moderation), skipping video moderation`,
    );
    return;
  }

  // Fetch all thumbnails and run moderation in parallel with concurrency limit
  const limit = pLimit(MAX_CONCURRENT_REKOGNITION_CALLS);
  let violationDetected = false;
  let firstViolation: { time: number; result: ModerationResult } | null = null;

  const checks = timestamps.map((timeSec, index) =>
    limit(async () => {
      // Skip if violation already detected
      if (violationDetected) {
        return;
      }

      try {
        // Fetch thumbnail from Mux
        const thumbnailBytes = await fetchThumbnailFromMux(playbackId, timeSec);

        // Run Rekognition on the image bytes
        const result = await checkImageModerationBytes(
          thumbnailBytes,
          `${assetId} frame ${index} @ ${timeSec}s`,
        );

        if (result.isExplicit) {
          violationDetected = true;
          firstViolation = { time: timeSec, result };
        }
      } catch (error) {
        console.error(
          `Failed to check frame ${index} @ ${timeSec}s for asset ${assetId}:`,
          error,
        );
        // Continue processing other frames on error
      }
    }),
  );

  // Wait for all checks to complete
  await Promise.all(checks);

  if (violationDetected && firstViolation) {
    const violation: { time: number; result: ModerationResult } =
      firstViolation;
    console.log(
      `Explicit content detected in video ${assetId} at ${violation.time}s: ${violation.result.labels?.join(", ")}`,
    );

    // Delete Mux asset
    try {
      await mux.deleteAsset(assetId);
      console.log(`Deleted Mux asset ${assetId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      // Ignore if asset already deleted
      if (
        !errorMessage.includes("not found") &&
        !errorMessage.includes("404")
      ) {
        console.error(`Failed to delete Mux asset ${assetId}:`, error);
      }
    }

    // Decrement recipient's post count since it was already incremented by Mux lambda
    if (post.status === "processed") {
      await db
        .update(schema.userStats)
        .set({ posts: sql`GREATEST(${schema.userStats.posts} - 1, 0)` })
        .where(eq(schema.userStats.userId, post.recipientUserId));
    }

    // Delete the post from the database
    await db.delete(schema.post).where(eq(schema.post.id, postId));

    console.log(
      `Video ${assetId} rejected, deleted, and post ${postId} removed from database due to moderation violation`,
    );
  } else {
    console.log(
      `Video ${assetId} passed moderation for post ${postId} - no action needed (already marked as processed by Mux lambda)`,
    );
  }
}

/**
 * Parse SQS record into either a photo job or video job
 */
async function parseRecord(
  record: SQSRecord,
): Promise<ImageJob | VideoJob | null> {
  try {
    const body = JSON.parse(record.body) as unknown;

    // Check if it's a video job (from Mux lambda)
    const videoResult = videoJobSchema.safeParse(body);
    if (videoResult.success) {
      console.log("Parsed video moderation job", {
        assetId: videoResult.data.assetId,
        postId: videoResult.data.postId,
        timestamps: videoResult.data.timestamps.length,
      });
      return videoResult.data;
    }

    // Check if it's an S3 notification (photo)
    const s3Result = s3NotificationSchema.safeParse(body);
    if (s3Result.success) {
      const s3Record = s3Result.data.Records[0];
      if (!s3Record) {
        return null;
      }

      const bucket = s3Record.s3.bucket.name;
      const key = decodeURIComponent(
        s3Record.s3.object.key.replace(/\+/g, " "),
      );

      // Get postId from S3 object
      const postId = await getPostIdFromS3Object(bucket, key);
      if (!postId) {
        console.warn(`Could not determine postId for ${key}, skipping`);
        return null;
      }

      console.log("Parsed photo moderation job", { bucket, key, postId });
      return {
        type: "image",
        bucket,
        key,
        postId,
      } as ImageJob;
    }

    console.warn(`Unknown message format in SQS record:`, body);
    return null;
  } catch (error) {
    console.error(`Failed to parse SQS record:`, error);
    return null;
  }
}

/**
 * Main Lambda handler for SQS batch processing
 */
export const handler = async (
  event: SQSEvent,
  _context: Context,
): Promise<SQSBatchResponse> => {
  console.log(`Processing ${event.Records.length} SQS records`);

  const failedMessageIds: string[] = [];

  // Parse all records
  const jobs = await Promise.all(
    event.Records.map(async (record) => ({
      record,
      job: await parseRecord(record),
    })),
  );

  // Separate photo and video jobs
  const photoJobs = jobs
    .filter((j) => j.job?.type === "image")
    .map((j) => ({ record: j.record, job: j.job as ImageJob }));

  const videoJobs = jobs
    .filter((j) => j.job?.type === "video")
    .map((j) => ({ record: j.record, job: j.job as VideoJob }));

  console.log(
    `Parsed ${photoJobs.length} photo jobs, ${videoJobs.length} video jobs`,
  );

  // Process photo jobs with concurrency limit
  const photoLimit = pLimit(MAX_CONCURRENT_REKOGNITION_CALLS);
  await Promise.allSettled(
    photoJobs.map(({ record, job }) =>
      photoLimit(async () => {
        try {
          await processPhotoJob(job);
        } catch (error) {
          console.error(`Failed to process photo job:`, error);
          failedMessageIds.push(record.messageId);
          throw error;
        }
      }),
    ),
  );

  // Process video jobs sequentially (each video processes frames in parallel internally)
  for (const { record, job } of videoJobs) {
    try {
      await processVideoJob(job);
    } catch (error) {
      console.error(`Failed to process video job:`, error);
      failedMessageIds.push(record.messageId);
    }
  }

  console.log(
    `Completed processing: ${failedMessageIds.length} failures out of ${event.Records.length} records`,
  );

  return {
    batchItemFailures: failedMessageIds.map((id) => ({
      itemIdentifier: id,
    })),
  };
};
