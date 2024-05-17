import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { mux } from "@oppfy/mux";
import { db, schema } from '@oppfy/db';
import { z } from 'zod';

// Your Mux signing secret
const muxWebhookSecret = process.env.MUX_WEBHOOK_SECRET!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {

    // Extract the raw body and headers
    const rawBody = event.body; // need this to verify mux signature
    const muxSignatureHeader = event.headers['mux-signature'];

    if (!rawBody || !muxSignatureHeader) {
      return {
        statusCode: 400,
        body: 'Missing raw body or mux-signature header',
      };
    }

    const jsonBody = JSON.parse(rawBody)

    const muxBodySchema = z.object({
      type: z.string(), 
      object: z.object({
        id: z.string(),
        type: z.string(),
        error: z.string().optional(),
      }),
    }).passthrough();

    const data = muxBodySchema.parse(jsonBody);

    // Verify the Mux webhook signature
    try {
      console.log(`Verifying Mux signature: ${muxSignatureHeader}`)
      mux.webhooks.verifySignature(rawBody, {"mux-signature": muxSignatureHeader}, muxWebhookSecret);
      console.log('Mux signature verified');
      await db.insert(schema.post).values({
        recipient: 'j8liUllmz5aEFt157qfe1ptSWgZ2',
        caption: 'New video uploaded',
        key: data.object.id,
        author: 'kYJQhA9vTLdUynlItU3y907c0Vs1',
        mediaType: "image",
      })
    } catch (error) {
      console.error('Error verifying Mux webhook signature:', error);
      return {
        statusCode: 401,
        body: 'Invalid Mux Webhook Signature',
      };
    }

    // Process the webhook event
    // For example, update your database or trigger other actions

    return {
      statusCode: 200,
      body: 'Webhook received and processed',
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};
