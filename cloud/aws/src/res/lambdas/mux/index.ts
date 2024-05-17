import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { mux } from "@acme/mux";
import { db, schema } from '@acme/db';

// Your Mux signing secret
const muxWebhookSecret = process.env.MUX_WEBHOOK_SECRET!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Log the incoming event for debugging
    console.log('Event:', JSON.stringify(event));

    // Extract the raw body and headers
    const rawBody = event.body;
    const muxSignatureHeader = event.headers['mux-signature'];

    if (!rawBody || !muxSignatureHeader) {
      return {
        statusCode: 400,
        body: 'Missing raw body or mux-signature header',
      };
    }

    // Verify the Mux webhook signature
    try {
      mux.webhooks.verifySignature(rawBody, {"mux-signature" : muxSignatureHeader}, muxWebhookSecret);
      console.log('Mux signature verified');
      await db.insert(schema.post).values({
        author: 'Mux',
        caption: 'New video uploaded',
        key: 'mux-webhook',
        recipient: 'acme',
        mediaType: 'video',
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
