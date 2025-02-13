import {
  PublishBatchCommand,
  PublishCommand,
  SNSClient,
} from "@aws-sdk/client-sns";
import type {
  PublishBatchCommandInput,
  PublishCommandInput,
} from "@aws-sdk/client-sns";

import { env } from "@oppfy/env";

export class SNSService {
  private client: SNSClient;

  constructor() {
    this.client = new SNSClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async publish(input: PublishCommandInput): Promise<void> {
    const command = new PublishCommand(input);
    await this.client.send(command);
  }

  async publishBatch(input: PublishBatchCommandInput): Promise<void> {
    const command = new PublishBatchCommand(input);
    await this.client.send(command);
  }

  // New method for sending notifications
  async sendNotification(
    topicArn: string,
    message: Record<string, any>,
    subject: string = "New notification",
  ): Promise<void> {
    await this.publish({
      Subject: subject,
      TopicArn: topicArn,
      Message: JSON.stringify(message),
    });
  }

  // New method for sending batch notifications
  async sendBatchNotifications(
    topicArn: string,
    messages: Record<string, any>[],
    subject: string = "New notification",
  ): Promise<void> {
    const CHUNK_SIZE = 10; // SNS batch limit

    // Split notifications into chunks of 10
    const chunks: Record<string, any>[][] = [];
    for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
      chunks.push(messages.slice(i, i + CHUNK_SIZE));
    }

    // Process each chunk as a batch request
    for (const chunk of chunks) {
      const batchEntries = chunk.map((message, index) => ({
        Id: `notif_${index}`, // Unique within batch
        Message: JSON.stringify(message),
        Subject: subject,
      }));

      await this.publishBatch({
        TopicArn: topicArn,
        PublishBatchRequestEntries: batchEntries,
      });
    }
  }
}

// Export a singleton instance
export const sns = new SNSService();
