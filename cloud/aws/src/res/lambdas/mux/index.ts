import { createEnv } from "@t3-oss/env-core";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";

import { db, schema } from "@oppfy/db";
import { mux } from "@oppfy/mux";

const env = createEnv({
  server: {
    MUX_WEBHOOK_SECRET: z.string().min(1),
  },
  runtimeEnv: process.env,
});

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    // Extract the raw body and headers
    const rawBody = event.body; // need this to verify mux signature
    const muxSignatureHeader = event.headers["mux-signature"];

    if (!rawBody || !muxSignatureHeader) {
      return {
        statusCode: 400,
        body: "Missing raw body or mux-signature header",
      };
    }

    const jsonBody = JSON.parse(rawBody);
    console.log("Received Mux webhook event:", jsonBody);

    const m = z.object({
      type: z.string(),
    });

    const muxBodySchema = z
      .object({
        type: z.string(),
        object: z.object({
          id: z.string(),
          type: z.string(),
          error: z.string().optional(),
        }),
        data: z.object({
          passthrough: z.string().optional(),
          playback_ids: z.array(
            z.object({
              id: z.string(),
            }),
          ).nonempty({
            message: "Playback IDs must not be empty"
          }),
          aspect_ratio: z.string(),
        }),
      })
      .passthrough();

    const metadataSchema = z.object({
      authorId: z.string(),
      recipientId: z.string(),
      caption: z.string(),
      height: z.number(),
      width: z.number(),
    });

    const t = m.parse(jsonBody);

    if (t.type != "video.asset.ready") {
      console.log("Ignoring Mux webhook event:", t.type);
      return {
        statusCode: 200,
        body: "Webhook received and ignored",
      };
    }

    const parsedMuxResponseBody = muxBodySchema.parse(jsonBody);

    const jsonMetadata = parsedMuxResponseBody.data.passthrough
      ? JSON.parse(parsedMuxResponseBody.data.passthrough)
      : {};

    console.log(jsonMetadata);

    const metadata = metadataSchema.parse(jsonMetadata);

    // Verify the Mux webhook signature
    try {
      mux.webhooks.verifySignature(
        rawBody,
        // event.headers,
        { "mux-signature": muxSignatureHeader },
        env.MUX_WEBHOOK_SECRET,
      );
      console.log("Mux signature verified");

      const post = await db.insert(schema.post).values({
        recipient: metadata.recipientId,
        caption: metadata.caption,
        key: parsedMuxResponseBody.data.playback_ids[0].id,
        author: metadata.authorId,
        mediaType: "video",
        width: metadata.width,
        height: metadata.height,
      }).returning({insertedId: schema.post.id});

      if (!post[0]?.insertedId) {
        return {
          statusCode: 500,
          body: "Failed to insert post",
        };
      }

      await db.insert(schema.postStats).values({ postId: post[0]?.insertedId });
      return {
        statusCode: 200,
        body: "Webhook received and processed",
      };
    } catch (error) {
      console.error("Error verifying Mux webhook signature:", error);
      return {
        statusCode: 401,
        body: "Invalid Mux Webhook Signature",
      };
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
