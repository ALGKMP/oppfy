import { env } from "@oppfy/env";

import { DomainError, ErrorCode } from "../../errors";
import { NotificationsRepository } from "../../repositories/user/notifications";
import type {
  EventType,
  NotificationSettings,
  SendNotificationData,
  SnsNotificationData,
  StoreNotificationData,
} from "../../repositories/user/notifications";
import { S3Service } from "../aws/s3";
import { UserService } from "./user";

export class NotificationsService {
  private notificationsRepository = new NotificationsRepository();

  private userService = new UserService();
  private s3Service = new S3Service();

  async getNotificationSettings(userId: string) {
    const user = await this.userService.getUser(userId);

    const notificationSettings =
      await this.notificationsRepository.getNotificationSettings(
        user.notificationSettingsId,
      );

    if (notificationSettings === undefined) {
      throw new DomainError(ErrorCode.NOTIFICATION_SETTINGS_NOT_FOUND);
    }

    return notificationSettings;
  }

  async paginateNotifications(
    userId: string,
    cursor: { createdAt: Date } | null = null,
    pageSize = 10,
  ) {
    const items = await this.notificationsRepository.paginateNotifications(
      userId,
      cursor,
      pageSize,
    );

    const itemsWithProfilePictureUrls = await Promise.all(
      items.map(async (notification) => {
        const { profilePictureKey, eventType, ...rest } = notification;

        const profilePictureUrl = await this.s3Service.getObjectPresignedUrl({
          Bucket: env.S3_PROFILE_BUCKET,
          Key: profilePictureKey,
        });

        const { username } = rest;

        if (username === null) {
          throw new DomainError(ErrorCode.USERNAME_NOT_FOUND);
        }

        const message = (() => {
          switch (eventType) {
            case "like":
              return `${username} liked your post!`;
            case "post":
              return `New post from ${username}!`;
            case "comment":
              return `${username} commented on your post!`;
            case "follow":
              return `${username} started following you!`;
            case "friend":
              return `You and ${username} are now friends!`;
            case "followRequest":
              return `${username} wants to follow you!`;
            case "friendRequest":
              return `${username} sent you a friend request!`;
          }
        })();

        return {
          ...rest,
          message,
          profilePictureUrl,
        };
      }),
    );

    const nextCursor = items[items.length - 1];

    return {
      items: itemsWithProfilePictureUrls,
      nextCursor: nextCursor ? { createdAt: nextCursor.createdAt } : null,
    };
  }

  async updateNotificationSettings(
    userId: string,
    newNotificationSettings: NotificationSettings,
  ) {
    const user = await this.userService.getUser(userId);

    const notificationSettings =
      await this.notificationsRepository.getNotificationSettings(
        user.notificationSettingsId,
      );

    if (notificationSettings === undefined) {
      throw new DomainError(ErrorCode.NOTIFICATION_SETTINGS_NOT_FOUND);
    }
    await this.notificationsRepository.updateNotificationSettings(
      user.notificationSettingsId,
      newNotificationSettings,
    );
  }

  async storeNotification(
    senderId: string,
    recipientId: string,
    notificationData: StoreNotificationData,
  ) {
    await this.notificationsRepository.storeNotification(
      senderId,
      recipientId,
      notificationData,
    );
  }

  async deleteNotification(
    senderId: string,
    eventType?: EventType | EventType[],
  ) {
    this.notificationsRepository.deleteNotification(senderId, eventType);
  }

  async sendNotification(
    senderId: string,
    recipientId: string,
    notificationData: SendNotificationData,
  ) {
    const pushTokens =
      await this.notificationsRepository.getPushTokens(recipientId);

    if (pushTokens.length === 0) {
      throw new DomainError(ErrorCode.PUSH_TOKEN_NOT_FOUND);
    }

    await this.notificationsRepository.sendNotification(
      pushTokens,
      senderId,
      recipientId,
      notificationData,
    );
  }

  async storePushToken(userId: string, pushToken: string) {
    await this.notificationsRepository.storePushToken(userId, pushToken);
  }
}
