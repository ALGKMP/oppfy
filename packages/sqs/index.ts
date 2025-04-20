import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import type {
  DeleteMessageCommandInput,
  DeleteMessageCommandOutput,
  ReceiveMessageCommandInput,
  ReceiveMessageCommandOutput,
  SendMessageCommandInput,
  SendMessageCommandOutput,
} from "@aws-sdk/client-sqs";

import { env } from "@oppfy/env";

export type EventType = "like" | "post" | "comment" | "follow" | "friend";

export type EntityType = "post" | "profile" | "comment";

export interface SendNotificationParams {
  senderId: string;
  recipientId: string;
  title: string;
  body: string;
  eventType: EventType;
  entityId: string;
  entityType: EntityType;
}

export class SQS {
  private client: SQSClient;

  constructor() {
    this.client = new SQSClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async sendMessage(
    sendMessageCommandInput: SendMessageCommandInput,
  ): Promise<SendMessageCommandOutput> {
    const command = new SendMessageCommand(sendMessageCommandInput);
    return await this.client.send(command);
  }

  async receiveMessage(
    receiveMessageCommandInput: ReceiveMessageCommandInput,
  ): Promise<ReceiveMessageCommandOutput> {
    const command = new ReceiveMessageCommand(receiveMessageCommandInput);
    return await this.client.send(command);
  }

  async deleteMessage(
    deleteMessageCommandInput: DeleteMessageCommandInput,
  ): Promise<DeleteMessageCommandOutput> {
    const command = new DeleteMessageCommand(deleteMessageCommandInput);
    return await this.client.send(command);
  }

  // New method for sending contact sync messages
  async sendContactSyncMessage({
    userId,
    userPhoneNumberHash,
    contacts,
  }: {
    userId: string;
    userPhoneNumberHash: string;
    contacts: string[];
  }): Promise<{ success: boolean; messageId: string }> {
    const result = await this.sendMessage({
      QueueUrl: env.SQS_CONTACT_QUEUE,
      MessageBody: JSON.stringify({
        userId,
        userPhoneNumberHash,
        contacts,
      }),
    });

    return {
      success: true,
      messageId: `${userId}_contactsync_${Date.now().toString()}`,
    };
  }

  async sendNotificationMessage(params: SendNotificationParams) {
    const result = await this.sendMessage({
      QueueUrl: env.SQS_NOTIFICATION_QUEUE,
      MessageBody: JSON.stringify(params),
    });

    return result;
  }
}
