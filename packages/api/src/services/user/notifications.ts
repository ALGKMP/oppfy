import { DomainError, ErrorCode } from "../../errors";
import { NotificationsRepository } from "../../repositories/user/notifications";
import type {
  EntityType,
  EventType,
  NotificationSettings,
} from "../../repositories/user/notifications";
import { UserRepository } from "../../repositories/user/user";

import { cloudfront } from "@oppfy/cloudfront";

export class NotificationsService {
  private notificationsRepository = new NotificationsRepository();
  private userRepository = new UserRepository();

  async getNotificationSettings(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

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
          ? await cloudfront.getSignedProfilePictureUrl(profilePictureKey)
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
    const user = await this.userRepository.getUser(userId);

    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

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
