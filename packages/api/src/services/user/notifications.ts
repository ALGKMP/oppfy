import { env } from "@oppfy/env";
import { sns } from "@oppfy/sns";

import { DomainError, ErrorCode } from "../../errors";
import { NotificationsRepository } from "../../repositories/user/notifications";
import type {
  EntityType,
  EventType,
  NotificationSettings,
  SendNotificationData,
  StoreNotificationData,
} from "../../repositories/user/notifications";
import { ProfileRepository } from "../../repositories/user/profile";
import { ProfileService } from "./profile";
import { UserService } from "./user";

export class NotificationsService {
  private notificationsRepository = new NotificationsRepository();

  private userService = new UserService();
  private profileRepository = new ProfileRepository();
  private profileService = new ProfileService();

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

  async getUnreadNotificationsCount(userId: string) {
    return this.notificationsRepository.getUnreadNotificationsCount(userId);
  }

  async getRecentNotifications(options: {
    senderId?: string;
    recipientId?: string;
    eventType?: EventType;
    entityId?: string;
    entityType?: EntityType;
    minutesThreshold: number;
    limit: number;
  }) {
    return this.notificationsRepository.getRecentNotifications(options);
  }

  async paginateNotifications(
    userId: string,
    cursor: { createdAt: Date; id: string } | null = null,
    pageSize = 10,
  ) {
    const items = await this.notificationsRepository.paginateNotifications(
      userId,
      cursor,
      pageSize,
    );

    const itemsWithProfilePictureUrls = await Promise.all(
      items.map(async (notification) => {
        const { profilePictureKey, ...rest } = notification;

        const profilePictureUrl = profilePictureKey
          ? await this.profileService.getSignedProfilePictureUrl(
              profilePictureKey,
            )
          : null;

        return {
          ...rest,
          profilePictureUrl,
        };
      }),
    );

    const nextCursor = items[items.length - 1];
    return {
      items: itemsWithProfilePictureUrls.slice(0, pageSize),
      nextCursor:
        items.length > pageSize && nextCursor
          ? { createdAt: nextCursor.createdAt, id: nextCursor.id }
          : null,
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

  async sendNotifications(
    data: {
      pushTokens: string[];
      senderId: string;
      recipientId: string;
      notificationData: SendNotificationData;
    }[],
  ): Promise<void> {
    const messages = data.map((item) => ({
      senderId: item.senderId,
      recipientId: item.recipientId,
      pushTokens: item.pushTokens,
      ...item.notificationData,
    }));

    await sns.sendBatchNotifications(
      env.SNS_PUSH_NOTIFICATION_TOPIC_ARN,
      messages,
      "New notification",
    );
  }

  async sendNotification(
    senderId: string,
    recipientId: string,
    notificationData: SendNotificationData,
  ): Promise<void> {
    const pushTokens =
      await this.notificationsRepository.getPushTokens(recipientId);
    const message = {
      senderId,
      recipientId,
      pushTokens,
      ...notificationData,
    };

    await sns.sendNotification(
      env.SNS_PUSH_NOTIFICATION_TOPIC_ARN,
      message,
      "New notification",
    );
  }

  async storePushToken(userId: string, pushToken: string) {
    await this.notificationsRepository.storePushToken(userId, pushToken);
  }

  async deletePushToken(userId: string, pushToken: string) {
    await this.notificationsRepository.deletePushToken(userId, pushToken);
  }

  async deleteNotification(id: string) {
    await this.notificationsRepository.deleteNotificationById(id);
  }

  async deleteNotifications(options: {
    senderId?: string;
    recipientId?: string;
    eventType?: EventType | EventType[];
    entityType?: EntityType;
    entityId?: string;
  }) {
    await this.notificationsRepository.deleteNotifications(options);
  }

  async deleteNotificationFromSenderToRecipient(
    senderId: string,
    recipientId: string,
    options: {
      eventType?: EventType | EventType[];
      entityType?: EntityType;
      entityId?: string;
    },
  ) {
    await this.notificationsRepository.deleteNotifications({
      senderId,
      recipientId,
      ...options,
    });
  }

  async deleteAllNotificationsForUser(userId: string) {
    await this.deleteNotifications({ recipientId: userId });
  }

  async deleteAllNotificationsForEntity(
    entityId: string,
    entityType: EntityType,
  ) {
    await this.deleteNotifications({ entityId, entityType });
  }
}
