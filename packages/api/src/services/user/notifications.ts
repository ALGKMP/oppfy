import { cloudfront } from "@oppfy/cloudfront";

import { DomainError, ErrorCode } from "../../errors";
import { NotificationsRepository } from "../../repositories/user/notifications";
import type {
  EntityType,
  EventType,
  NotificationSettings,
} from "../../repositories/user/notifications";
import { UserRepository } from "../../repositories/user/user";

export class NotificationsService {
  private notificationsRepository = new NotificationsRepository();
  private userRepository = new UserRepository();

  async getNotificationSettings({ userId }: { userId: string }) {
    const user = await this.userRepository.getUser({ userId });

    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    const notificationSettings =
      await this.notificationsRepository.getNotificationSettings({
        notificationSettingsId: user.notificationSettingsId,
      });

    if (notificationSettings === undefined) {
      throw new DomainError(ErrorCode.NOTIFICATION_SETTINGS_NOT_FOUND);
    }

    return notificationSettings;
  }

  async getUnreadNotificationsCount({ userId }: { userId: string }) {
    return this.notificationsRepository.getUnreadNotificationsCount({ userId });
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

  async paginateNotifications({
    userId,
    cursor = null,
    pageSize = 10,
  }: {
    userId: string;
    cursor?: { createdAt: Date; id: string } | null;
    pageSize?: number;
  }) {
    const items = await this.notificationsRepository.paginateNotifications({
      userId,
      cursor,
      pageSize,
    });

    const itemsWithProfilePictureUrls = await Promise.all(
      items.map(async (notification) => {
        const { profilePictureKey, ...rest } = notification;

        const profilePictureUrl = profilePictureKey
          ? await cloudfront.getSignedProfilePictureUrl(profilePictureKey)
          : null;

        return { ...rest, profilePictureUrl };
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

  async updateNotificationSettings({
    userId,
    newNotificationSettings,
  }: {
    userId: string;
    newNotificationSettings: NotificationSettings;
  }) {
    const user = await this.userRepository.getUser({ userId });

    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    const notificationSettings =
      await this.notificationsRepository.getNotificationSettings({
        notificationSettingsId: user.notificationSettingsId,
      });

    if (notificationSettings === undefined) {
      throw new DomainError(ErrorCode.NOTIFICATION_SETTINGS_NOT_FOUND);
    }
    await this.notificationsRepository.updateNotificationSettings({
      notificationSettingsId: user.notificationSettingsId,
      notificationSettings: newNotificationSettings,
    });
  }

  async storePushToken({
    userId,
    pushToken,
  }: {
    userId: string;
    pushToken: string;
  }) {
    await this.notificationsRepository.storePushToken({ userId, pushToken });
  }

  async deletePushToken({
    userId,
    pushToken,
  }: {
    userId: string;
    pushToken: string;
  }) {
    await this.notificationsRepository.deletePushToken({ userId, pushToken });
  }
}
