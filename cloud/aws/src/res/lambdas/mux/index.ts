import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";

import { db, schema } from "@oppfy/db";
import { mux } from "@oppfy/mux";

// Your Mux signing secret
const muxWebhookSecret = process.env.MUX_WEBHOOK_SECRET!;

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
        }),
      })
      .passthrough();

    const metadataSchema = z.object({
      authorId: z.string(),
      recipientId: z.string(),
      caption: z.string().nullable(),
    });

    const data = muxBodySchema.parse(jsonBody);

    if (data.type != "video.asset.ready") {
      console.log("Ignoring Mux webhook event:", data.type);
      return {
        statusCode: 200,
        body: "Webhook received and ignored",
      };
    }

    const jsonMetadata = data.data.passthrough
      ? JSON.parse(data.data.passthrough)
      : {};

    const metadata = metadataSchema.parse(jsonMetadata);

    // Verify the Mux webhook signature
    try {
      console.log(`Verifying Mux signature: ${muxSignatureHeader}`);
      mux.webhooks.verifySignature(
        rawBody,
        { "mux-signature": muxSignatureHeader },
        muxWebhookSecret,
      );
      console.log("Mux signature verified");

      const post = await db.insert(schema.post).values({
        recipient: metadata.recipientId,
        caption: metadata.caption,
        key: data.object.id,
        author: metadata.authorId,
        mediaType: "video",
      });
      if (!post) {
        return {
          statusCode: 500,
          body: "Failed to create post",
        };
      }
      const postStats = await db.insert(schema.postStats).values({ postId: post[0].insertId})
      if (!postStats) {
        return {
          statusCode: 500,
          body: "Failed to create post stats",
        };
      }
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

    // Process the webhook event
    // For example, update your database or trigger other actions

    return {
      statusCode: 200,
      body: "Webhook received and processed",
    };
  } catch (error) {
    console.error("Error processing webhook:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
