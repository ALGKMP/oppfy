import { parser } from "@aws-lambda-powertools/parser/middleware";
import { APIGatewayProxyEventV2Schema } from "@aws-lambda-powertools/parser/schemas";
import middy from "@middy/core";
import { z } from "zod";

import { db, schema } from "@oppfy/db";
import { mux } from "@oppfy/mux";
import { sharedValidators } from "@oppfy/validators";

type APIGatewayProxyEvent = z.infer<typeof APIGatewayProxyEventV2Schema>;

const muxBodySchema = z
  .object({
    type: z.literal("video.asset.ready"),
    object: z.object({
      id: z.string(),
      type: z.string(),
      error: z.string().optional(),
    }),
    data: z.object({
      aspect_ratio: z.string(),
      playback_ids: z.array(z.object({ id: z.string() })).nonempty(),
      passthrough: z
        .string()
        .transform((str) =>
          sharedValidators.aws.metadataSchema.parse(JSON.parse(str)),
        ),
    }),
  })
  .passthrough();

const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<void> => {
  const rawBody = event.body;
  const headers = event.headers;

  if (rawBody === undefined) {
    throw new Error("Missing raw body or mux-signature header");
  }

  try {
    mux.webhooks.verifySignature(rawBody, headers);
  } catch {
    throw new Error("Invalid Mux Webhook Signature");
  }

  const body = muxBodySchema.parse(JSON.parse(rawBody));

  const key = body.data.playback_ids[0].id;
  const metadata = body.data.passthrough;

  const data = {
    key,
    mediaType: "video" as const,
    author: metadata.author,
    height: parseInt(metadata.height),
    width: parseInt(metadata.width),
    caption: metadata.caption,
  };

  if (metadata.type === "onApp") {
    await db.transaction(async (tx) => {
      const [post] = await tx
        .insert(schema.post)
        .values({
          ...data,
          recipient: metadata.recipient,
        })
        .returning({ insertId: schema.post.id });

      if (post === undefined) {
        throw new Error("Failed to insert post");
      }

      await tx.insert(schema.postStats).values({ postId: post.insertId });
    });
  } else {
    await db.insert(schema.postOfUserNotOnApp).values({
      ...data,
      phoneNumber: metadata.number,
    });
  }
};

export const handler = middy(lambdaHandler).use(
  parser({ schema: APIGatewayProxyEventV2Schema }),
);
