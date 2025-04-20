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

/* export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "friend"
  | "followRequest"
  | "friendRequest";

export type EntityType = "post" | "profile";

export interface SendNotificationData {
  title: string;
  body: string;
  entityId?: string;
  entityType?: EntityType;
}

export interface NotificationMessage {
  pushTokens: string[];
  senderId: string;
  recipientId: string;
  title: string;
  body: string;
  entityId?: string;
  entityType?: EntityType;
  notificationType?: NotificationType;
}

export interface NotificationSettings {
  posts: boolean;
  likes: boolean;
  comments: boolean;
  mentions: boolean;
  friendRequests: boolean;
  followRequests: boolean;
}
 */
export class SNS {
/*   private client: SNSClient;

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

  async sendNotification(
    topicArn: string,
    message: NotificationMessage,
    subject: string = "New notification",
  ): Promise<void> {
    await this.publish({
      Subject: subject,
      TopicArn: topicArn,
      Message: JSON.stringify(message),
    });
  }

  async sendBatchNotifications(
    topicArn: string,
    messages: NotificationMessage[],
    subject: string = "New notification",
  ): Promise<void> {
    const CHUNK_SIZE = 10; // SNS batch limit

    // Split notifications into chunks of 10
    const chunks: NotificationMessage[][] = [];
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
 */
/*   // Helper methods for common notification types
  async sendLikeNotification(
    pushTokens: string[],
    senderId: string,
    recipientId: string,
    username: string,
    postId: string,
  ): Promise<void> {
    await this.sendNotification(env.SNS_PUSH_NOTIFICATION_TOPIC_ARN, {
      pushTokens,
      senderId,
      recipientId,
      title: "New like",
      body: `${username} liked your post`,
      entityType: "post",
      entityId: postId,
      notificationType: "like",
    });
  }

  async sendCommentNotification(
    pushTokens: string[],
    senderId: string,
    recipientId: string,
    username: string,
    postId: string,
  ): Promise<void> {
    await this.sendNotification(env.SNS_PUSH_NOTIFICATION_TOPIC_ARN, {
      pushTokens,
      senderId,
      recipientId,
      title: "New Comment",
      body: `${username} commented on your post`,
      entityType: "post",
      entityId: postId,
      notificationType: "comment",
    });
  }

  async sendFollowRequestNotification(
    pushTokens: string[],
    senderId: string,
    recipientId: string,
    username: string,
  ): Promise<void> {
    await this.sendNotification(env.SNS_PUSH_NOTIFICATION_TOPIC_ARN, {
      pushTokens,
      senderId,
      recipientId,
      title: "Follow Request",
      body: `${username} has sent you a follow request.`,
      entityType: "profile",
      entityId: senderId,
      notificationType: "followRequest",
    });
  }

  async sendFollowAcceptedNotification(
    pushTokens: string[],
    senderId: string,
    recipientId: string,
    username: string,
  ): Promise<void> {
    await this.sendNotification(env.SNS_PUSH_NOTIFICATION_TOPIC_ARN, {
      pushTokens,
      senderId,
      recipientId,
      title: "Follow Request Accepted",
      body: `${username} has accepted your follow request`,
      entityType: "profile",
      entityId: senderId,
      notificationType: "follow",
    });
  }

  async sendFriendRequestNotification(
    pushTokens: string[],
    senderId: string,
    recipientId: string,
    username: string,
  ): Promise<void> {
    await this.sendNotification(env.SNS_PUSH_NOTIFICATION_TOPIC_ARN, {
      pushTokens,
      senderId,
      recipientId,
      title: "Friend Request",
      body: `${username} has sent you a friend request.`,
      entityType: "profile",
      entityId: senderId,
      notificationType: "friendRequest",
    });
  }

  async sendFriendAcceptedNotification(
    pushTokens: string[],
    senderId: string,
    recipientId: string,
    username: string,
  ): Promise<void> {
    await this.sendNotification(env.SNS_PUSH_NOTIFICATION_TOPIC_ARN, {
      pushTokens,
      senderId,
      recipientId,
      title: "Friend Request Accepted",
      body: `${username} has accepted your friend request`,
      entityType: "profile",
      entityId: senderId,
      notificationType: "friend",
    });
  } */
}
