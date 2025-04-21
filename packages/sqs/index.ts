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

  private async sendMessage(
    sendMessageCommandInput: SendMessageCommandInput,
  ): Promise<SendMessageCommandOutput> {
    const command = new SendMessageCommand(sendMessageCommandInput);
    return await this.client.send(command);
  }

  private async receiveMessage(
    receiveMessageCommandInput: ReceiveMessageCommandInput,
  ): Promise<ReceiveMessageCommandOutput> {
    const command = new ReceiveMessageCommand(receiveMessageCommandInput);
    return await this.client.send(command);
  }

  private async deleteMessage(
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

  private async sendNotificationMessage(params: SendNotificationParams) {
    const result = await this.sendMessage({
      QueueUrl: env.SQS_NOTIFICATION_QUEUE,
      MessageBody: JSON.stringify(params),
    });

    return result;
  }

  async sendPostNotification({
    senderId,
    recipientId,
    username,
    postId,
  }: {
    senderId: string;
    recipientId: string;
    username: string;
    postId: string;
  }): Promise<void> {
    await this.sendNotificationMessage({
      senderId,
      recipientId,
      title: "You've been opped",
      body: `${username} posted a picture of you`,
      entityType: "post",
      entityId: postId,
      eventType: "post",
    });
  }

  // Helper methods for common notification types
  async sendLikeNotification({
    senderId,
    recipientId,
    username,
    postId,
  }: {
    senderId: string;
    recipientId: string;
    username: string;
    postId: string;
  }): Promise<void> {
    await this.sendNotificationMessage({
      senderId,
      recipientId,
      title: "New like",
      body: `${username} liked your post`,
      entityType: "post",
      entityId: postId,
      eventType: "like",
    });
  }

  async sendCommentNotification({
    senderId,
    recipientId,
    username,
    postId,
  }: {
    senderId: string;
    recipientId: string;
    username: string;
    postId: string;
  }): Promise<void> {
    await this.sendNotificationMessage({
      senderId,
      recipientId,
      title: "New Comment",
      body: `${username} commented on your post`,
      entityType: "post",
      entityId: postId,
      eventType: "comment",
    });
  }

  async sendFollowNotification({
    senderId,
    recipientId,
    username,
  }: {
    senderId: string;
    recipientId: string;
    username: string;
  }): Promise<void> {
    await this.sendNotificationMessage({
      senderId,
      recipientId,
      title: "New Follow",
      body: `${username} is now following you`,
      entityType: "profile",
      entityId: senderId,
      eventType: "follow",
    });
  }

  async sendFollowRequestNotification({
    senderId,
    recipientId,
    username,
  }: {
    senderId: string;
    recipientId: string;
    username: string;
  }): Promise<void> {
    await this.sendNotificationMessage({
      senderId,
      recipientId,
      title: "Follow Request",
      body: `${username} has sent you a follow request.`,
      entityType: "profile",
      entityId: senderId,
      eventType: "follow",
    });
  }

  async sendFollowAcceptedNotification({
    senderId,
    recipientId,
    username,
  }: {
    senderId: string;
    recipientId: string;
    username: string;
  }): Promise<void> {
    await this.sendNotificationMessage({
      senderId,
      recipientId,
      title: "Follow Request Accepted",
      body: `${username} has accepted your follow request`,
      entityType: "profile",
      entityId: senderId,
      eventType: "follow",
    });
  }

  async sendFriendRequestNotification({
    senderId,
    recipientId,
    username,
  }: {
    senderId: string;
    recipientId: string;
    username: string;
  }): Promise<void> {
    await this.sendNotificationMessage({
      senderId,
      recipientId,
      title: "Friend Request",
      body: `${username} has sent you a friend request.`,
      entityType: "profile",
      entityId: senderId,
      eventType: "friend",
    });
  }

  async sendFriendAcceptedNotification({
    senderId,
    recipientId,
    username,
  }: {
    senderId: string;
    recipientId: string;
    username: string;
  }): Promise<void> {
    await this.sendNotificationMessage({
      senderId,
      recipientId,
      title: "Friend Request Accepted",
      body: `${username} has accepted your friend request`,
      entityType: "profile",
      entityId: senderId,
      eventType: "friend",
    });
  }
}
